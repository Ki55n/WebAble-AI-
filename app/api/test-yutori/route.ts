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

    throw new Error('Could not parse JSON from response');
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }
    
    const { automationLog, screenshotUrls } = await req.json();
// DO NOT EDIT THIS IS FOR TESTING ONLY. 
    const prompt = `Here is the log from the automation run:\n\n${automationLog}\n\nPlease analyze this output and the accompanying screenshot(s).
        
        Return a JSON object with the following structure:
        {
          "summary": "A human-readable, concise summary of each of the findings (markdown supported)",
          "tickets": [
            {
              "title": "Short title for the issue",
              "description": "Detailed description of the issue",
              "priority": "high" | "medium" | "low"
            }
          ]
        }
        
        Do not wrap the JSON in markdown code blocks. Just return the raw JSON string.`;

    const imageParts = await Promise.all(
      (screenshotUrls || []).map((imageUrl: string) => createImagePart(imageUrl))
    );

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [createPartFromText(prompt), ...imageParts],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['summary', 'tickets'],
          properties: {
            summary: {
              type: Type.STRING,
            },
            tickets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['title', 'description', 'priority'],
                properties: {
                  title: {
                    type: Type.STRING,
                  },
                  description: {
                    type: Type.STRING,
                  },
                  priority: {
                    type: Type.STRING,
                    enum: ['high', 'medium', 'low'],
                  },
                },
              },
            },
          },
        },
      },
    });

    const responseContent = response.text || '{}';
    const parsedData = parseGeminiJsonResponse(responseContent);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Gemini Test API Error:', error);

    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : 500;
    const message =
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
        ? error.message
        : String(error);

    return NextResponse.json(
      { error: 'API Error', details: message },
      { status }
    );
  }
}
