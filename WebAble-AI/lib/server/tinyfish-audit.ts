const TINYFISH_AUDIT_ENDPOINT = "https://agent.tinyfish.ai/v1/automation/run-sse";

export type JsonRecord = Record<string, unknown>;

export interface NormalizedAuditOutput {
  steps: JsonRecord[];
  result: {
    score: number;
    risks: string[];
    fixes: string[];
  };
  audit_summary: string;
  raw: JsonRecord;
}

export interface TinyfishAuditExecution {
  output: NormalizedAuditOutput;
  logs: string[];
  streamingUrl: string | null;
}

export function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function clampScore(value: unknown, fallback = 5): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(10, Math.max(1, Math.round(value)));
}

function parsePossibleJsonObject(input: unknown): JsonRecord {
  if (isJsonRecord(input)) {
    return input;
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (isJsonRecord(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  return {};
}

function parseJsonIfPossible(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function looksLikeAuditPayload(value: unknown): boolean {
  if (!isJsonRecord(value)) {
    return false;
  }

  return (
    "steps" in value ||
    "result" in value ||
    "audit_summary" in value ||
    "score" in value ||
    "risks" in value ||
    "fixes" in value
  );
}

export function extractFinalOutputFromTinyfishEvent(
  event: JsonRecord,
): unknown | null {
  const type =
    typeof event.type === "string" ? event.type.toLowerCase() : undefined;
  const status =
    typeof event.status === "string" ? event.status.toLowerCase() : undefined;
  const state =
    typeof event.state === "string" ? event.state.toLowerCase() : undefined;

  const terminalSignals = new Set([
    "result",
    "final",
    "completed",
    "complete",
    "succeeded",
    "success",
    "done",
    "finished",
  ]);

  if (
    (type && terminalSignals.has(type)) ||
    (status && terminalSignals.has(status)) ||
    (state && terminalSignals.has(state))
  ) {
    const candidate =
      event.data ??
      event.output ??
      event.result ??
      event.payload ??
      event.response ??
      event;
    
    return parseJsonIfPossible(candidate);
  }

  if ("steps" in event && "result" in event) {
    return event;
  }

  const fallbackCandidates = [
    event.data,
    event.output,
    event.result,
    event.payload,
    event.response,
    event,
  ].map(parseJsonIfPossible);

  for (const candidate of fallbackCandidates) {
    if (looksLikeAuditPayload(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function parseSseEventBlock(rawEvent: string): string | null {
  const dataLines = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());

  if (dataLines.length === 0) {
    return null;
  }

  const payload = dataLines.join("\n").trim();
  if (!payload || payload === "[DONE]") {
    return null;
  }

  return payload;
}

export function buildVendorSecurityAuditGoal(vendor: string): string {
  return `
Perform a vendor security audit for ${vendor}

Tasks:
1. Visit the website
2. Find Privacy Policy, Terms and Security pages
3. Extract:
   - data retention
   - data sharing
4. Check:
   - HTTPS
   - compliance claims
   - security practices

Return JSON:
{
steps:[],
result:{
score:1-10,
risks:[],
fixes:[]
},
audit_summary:""
}
`;
}

export function normalizeVendorUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Vendor required");
  }

  const normalized = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const parsed = new URL(normalized);

  return parsed.toString();
}

export function normalizeAuditOutput(rawOutput: unknown): NormalizedAuditOutput {
  const parsed = parsePossibleJsonObject(rawOutput);
  
  // Handle both { result: { ... } } and directly { score, risks, fixes }
  const resultCandidate = isJsonRecord(parsed.result) ? parsed.result : parsed;
  const result = parsePossibleJsonObject(resultCandidate);

  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];
  const steps = rawSteps.filter((step): step is JsonRecord => isJsonRecord(step));

  return {
    steps,
    result: {
      score: clampScore(result.score),
      risks: asStringArray(result.risks),
      fixes: asStringArray(result.fixes),
    },
    audit_summary:
      typeof parsed.audit_summary === "string" ? parsed.audit_summary : "",
    raw: parsed,
  };
}