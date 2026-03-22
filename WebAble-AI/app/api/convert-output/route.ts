import { NextRequest, NextResponse } from 'next/server';
import {
  createPartFromBase64,
  createPartFromText,
  GoogleGenAI,
  Type,
} from '@google/genai';

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function createImagePart(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch screenshot: ${imageUrl} (${response.status})`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return createPartFromBase64(base64, contentType);
}

function parseGeminiJsonResponse(responseText: string) {
  try {
    return JSON.parse(responseText);
  } catch {
    const match =
      responseText.match(/```json\n([\s\S]*?)\n```/) ||
      responseText.match(/{[\s\S]*}/);

    if (match) {
      return JSON.parse(match[1] || match[0]);
    }

    return { summary: responseText, tickets: [] };
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

    const { screenshotUrl, screenshotUrls, automationLog, url } = await req.json();
    console.log("Input Body:", JSON.stringify({ screenshotUrl, screenshotUrls, automationLog, url }, null, 2));

    const urls = screenshotUrls || (screenshotUrl ? [screenshotUrl] : []);
    const urlContext = url ? `\n\nThis analysis is for the URL: ${url}` : '';

    const prompt = `Here is the log from the automation run:\n\n${automationLog}${urlContext}\n\nPlease analyze this output.

        Do not include any introductory text. Just the findings.
        
        Identify ALL accessibility findings and issues. For EACH distinct finding, you MUST create a separate ticket. If there are multiple findings, create one ticket per finding. If you find fewer than 3 distinct issues, identify additional accessibility concerns or improvements to reach a minimum of 3 tickets.
        
        Return a JSON object with the following structure:
        {
          "summary": "A human-readable, concise summary of all findings (markdown supported).",
          "tickets": [
            {
              "title": "Short title for the issue",
              "description": "Detailed description of the issue",
              "priority": "high" | "medium" | "low"
            }
          ]
        }
        
        CRITICAL: The "tickets" array must contain one ticket for EACH distinct finding. Each finding gets its own ticket object in the array. Create a minimum of 3 tickets total.
        
        Do not wrap the JSON in markdown code blocks. Just return the raw JSON string.`;

    const imageParts = await Promise.all(urls.map((imageUrl: string) => createImagePart(imageUrl)));
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [createPartFromText(prompt), ...imageParts],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["summary", "tickets"],
          properties: {
            summary: {
              type: Type.STRING,
            },
            tickets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "priority"],
                properties: {
                  title: {
                    type: Type.STRING,
                  },
                  description: {
                    type: Type.STRING,
                  },
                  priority: {
                    type: Type.STRING,
                    enum: ["high", "medium", "low"],
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log("Gemini API Response Body:", JSON.stringify(response, null, 2));

    const responseContent = response.text || "{}";
    console.log("Gemini API Raw Content:", responseContent);

    const parsedData = parseGeminiJsonResponse(responseContent);
    console.log("Gemini API Parsed Data:", JSON.stringify(parsedData, null, 2));

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
