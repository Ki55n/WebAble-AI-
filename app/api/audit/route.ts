import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuthUser } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { requireEnv } from "@/lib/server/env";
import { Report } from "@/lib/server/models/report";
import {
  buildVendorSecurityAuditGoal,
  extractFinalOutputFromTinyfishEvent,
  isJsonRecord,
  normalizeAuditOutput,
  normalizeVendorUrl,
  parseSseEventBlock,
} from "@/lib/server/tinyfish-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TINYFISH_AUDIT_ENDPOINT = "https://agent.tinyfish.ai/v1/automation/run-sse";

function toSseData(data: unknown, event?: string): string {
  const eventLine = event ? `event: ${event}\n` : "";
  return `${eventLine}data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuthUser(request);
    const body = await request.json();
    const vendorInput = typeof body?.vendor === "string" ? body.vendor : "";

    if (!vendorInput.trim()) {
      return NextResponse.json({ msg: "Vendor required" }, { status: 400 });
    }

    const vendor = normalizeVendorUrl(vendorInput);
    await connectToDatabase();

    const tinyfishApiKey = requireEnv("TINYFISH_API_KEY");
    const goal = buildVendorSecurityAuditGoal(vendor);

    const upstreamResponse = await fetch(TINYFISH_AUDIT_ENDPOINT, {
      method: "POST",
      headers: {
        "X-API-Key": tinyfishApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: vendor,
        goal,
      }),
    });

    if (!upstreamResponse.ok) {
      const details = await upstreamResponse.text();
      return NextResponse.json(
        {
          msg: "Audit failed",
          error: `TinyFish upstream error: ${upstreamResponse.status} ${upstreamResponse.statusText}`,
          details,
        },
        { status: upstreamResponse.status },
      );
    }

    if (!upstreamResponse.body) {
      return NextResponse.json(
        { msg: "Audit failed", error: "TinyFish response body is empty" },
        { status: 502 },
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const auditStream = new ReadableStream<Uint8Array>({
      start(controller) {
        const reader = upstreamResponse.body!.getReader();
        const logs: string[] = [];
        let streamBuffer = "";
        const state = {
          finalOutput: null as unknown,
          streamingUrl: null as string | null,
          closed: false,
        };

        const closeStream = () => {
          if (!state.closed) {
            state.closed = true;
            controller.close();
          }
        };

        const write = (value: string) => {
          if (state.closed) {
            return;
          }
          controller.enqueue(encoder.encode(value));
        };

        const writeSse = (data: unknown, event?: string) => {
          write(toSseData(data, event));
        };

        const heartbeat = setInterval(() => {
          try {
            write(": keep-alive\n\n");
          } catch {
            clearInterval(heartbeat);
          }
        }, 15000);

        const processRawEvent = (rawEvent: string) => {
          if (!rawEvent.trim()) {
            return;
          }

          write(`${rawEvent.trimEnd()}\n\n`);

          const payload = parseSseEventBlock(rawEvent);
          if (!payload) {
            return;
          }

          try {
            const event = JSON.parse(payload);
            if (!isJsonRecord(event)) {
              return;
            }

            const liveUrl = [
              event.streamingUrl,
              event.liveViewUrl,
              event.url,
            ].find((value): value is string => typeof value === "string");
            if (!state.streamingUrl && liveUrl) {
              state.streamingUrl = liveUrl;
            }

            const eventType =
              typeof event.type === "string" ? event.type.toLowerCase() : "";
            if (eventType === "log" || eventType === "progress") {
              const logMessage = [
                event.message,
                event.purpose,
                event.content,
              ].find((value): value is string => typeof value === "string");
              if (logMessage) {
                logs.push(logMessage);
              }
            }

            const maybeFinal = extractFinalOutputFromTinyfishEvent(event);
            if (maybeFinal !== null) {
              state.finalOutput = maybeFinal;
            }
          } catch {
            return;
          }
        };

        writeSse({ type: "audit_started", vendor }, "audit_status");

        void (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }

              streamBuffer += decoder.decode(value, { stream: true });
              const events = streamBuffer.split(/\r?\n\r?\n/);
              streamBuffer = events.pop() ?? "";

              for (const rawEvent of events) {
                processRawEvent(rawEvent);
              }
            }

            streamBuffer += decoder.decode();
            const trailing = streamBuffer.split(/\r?\n\r?\n/);
            for (const rawEvent of trailing) {
              processRawEvent(rawEvent);
            }

            if (!state.finalOutput) {
              throw new Error("No final result received from TinyFish");
            }

            const normalized = normalizeAuditOutput(state.finalOutput);
            const report = await Report.create({
              userId: user.id,
              runId: randomUUID(),
              vendor,
              score: normalized.result.score,
              risks: normalized.result.risks,
              fixes: normalized.result.fixes,
              steps: normalized.steps,
              summary: normalized.audit_summary,
              details: {
                ...normalized.raw,
                _meta: {
                  logs,
                  streamingUrl: state.streamingUrl,
                },
              },
            });

            writeSse(
              {
                type: "audit_saved",
                reportId: String(report._id),
                score: report.score,
                risks: report.risks,
                fixes: report.fixes,
                summary: report.summary,
                streamingUrl: state.streamingUrl,
              },
              "audit_result",
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Audit stream failed";
            writeSse({ type: "error", message }, "audit_error");
          } finally {
            clearInterval(heartbeat);
            closeStream();
          }
        })();
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", "text/event-stream; charset=utf-8");
    headers.set("Cache-Control", "no-cache, no-transform");
    headers.set("Connection", "keep-alive");
    headers.set("X-Accel-Buffering", "no");

    return new NextResponse(auditStream, { headers, status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ msg: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { msg: "Audit failed", error: message },
      { status: 500 },
    );
  }
}
