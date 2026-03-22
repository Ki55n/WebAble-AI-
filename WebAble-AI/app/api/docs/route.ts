import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "WebAble AI - API Documentation",
    version: "1.0.0",
    description:
      "Comprehensive API documentation for WebAble AI platform, featuring vendor security audits, reports, Yutori browser agents, and third-party integrations.",
  },
  servers: [
    {
      url: "/",
      description: "Current environment",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", example: "test@vendorshield.com" },
          password: { type: "string", example: "pass" },
        },
        required: ["email", "password"],
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          expiresIn: { type: "string" },
        },
      },
      AuditRequest: {
        type: "object",
        properties: {
          vendor: { type: "string", example: "example.com" },
        },
        required: ["vendor"],
      },
      Report: {
        type: "object",
        properties: {
          id: { type: "string" },
          vendor: { type: "string" },
          score: { type: "integer", minimum: 1, maximum: 10 },
          risks: { type: "array", items: { type: "string" } },
          fixes: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
          date: { type: "string", format: "date-time" },
        },
      },
      ReportDetail: {
        allOf: [
          { $ref: "#/components/schemas/Report" },
          {
            type: "object",
            properties: {
              runId: { type: "string" },
              steps: { type: "array", items: { type: "object" } },
              details: { type: "object" },
            },
          },
        ],
      },
      LinearTickets: {
        type: "object",
        properties: {
          tickets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priority: {
                  type: "string",
                  enum: ["urgent", "high", "medium", "low", "none"],
                },
              },
              required: ["title", "description"],
            },
          },
        },
        required: ["tickets"],
      },
      FetchHtmlRequest: {
        type: "object",
        properties: {
          url: { type: "string", example: "https://example.com" },
        },
        required: ["url"],
      },
      FindOwnersRequest: {
        type: "object",
        properties: {
          urls: { type: "array", items: { type: "string" } },
        },
        required: ["urls"],
      },
      RunAutomationRequest: {
        type: "object",
        properties: {
          url: { type: "string" },
          goal: { type: "string" },
        },
        required: ["url", "goal"],
      },
      BrowserAgentRequest: {
        type: "object",
        properties: {
          urls: { type: "array", items: { type: "string" } },
          goal: { type: "string" },
        },
        required: ["urls", "goal"],
      },
      TestYutoriRequest: {
        type: "object",
        properties: {
          automationLog: { type: "string" },
          screenshotUrls: { type: "array", items: { type: "string" } },
        },
        required: ["automationLog"],
      },
      ConvertOutputRequest: {
        type: "object",
        properties: {
          screenshotUrl: { type: "string" },
          screenshotUrls: { type: "array", items: { type: "string" } },
          automationLog: { type: "string" },
          url: { type: "string" },
        },
        required: ["automationLog"],
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        summary: "Login for authentication",
        tags: ["Auth"],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Successful login",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/login": {
      post: {
        summary: "Alias for /api/auth/login",
        tags: ["Auth"],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Successful login",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
        },
      },
    },
    "/api/audit": {
      post: {
        summary: "Start a vendor security audit",
        description:
          "Starts a security audit for a vendor and returns a Server-Sent Events (SSE) stream.",
        tags: ["Audit"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuditRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "SSE stream started",
            content: {
              "text/event-stream": {
                schema: { type: "string" },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/reports": {
      get: {
        summary: "List reports for the user",
        tags: ["Reports"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of reports",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Report" },
                },
              },
            },
          },
        },
      },
    },
    "/api/reports/{id}": {
      get: {
        summary: "Get a specific report",
        tags: ["Reports"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Report details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReportDetail" },
              },
            },
          },
          404: { description: "Report not found" },
        },
      },
    },
    "/api/reports/{id}/download": {
      get: {
        summary: "Download report PDF",
        tags: ["Reports"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "PDF file",
            content: { "application/pdf": {} },
          },
        },
      },
    },
    "/api/report/{id}/download": {
      get: {
        summary: "Alias for /api/reports/{id}/download",
        tags: ["Reports"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "PDF file",
            content: { "application/pdf": {} },
          },
        },
      },
    },

    "/api/convert-output": {
      post: {
        summary: "Convert automation output to accessibility tickets using Gemini",
        tags: ["AI Utilities"],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ConvertOutputRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Converted tickets",
          },
        },
      },
    },
    "/api/fetch-html": {
      post: {
        summary: "Fetch HTML content of a URL",
        tags: ["Utilities"],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FetchHtmlRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "HTML content",
          },
        },
      },
    },
    "/api/run-automation": {
      post: {
        summary: "Proxy request to TinyFish SSE API",
        tags: ["Utilities"],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RunAutomationRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "SSE stream started",
          },
        },
      },
    },
  },
};

export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>WebAble AI - API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" sizes="32x32" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
    <script>
    window.onload = function() {
        const ui = SwaggerUIBundle({
            spec: ${JSON.stringify(openApiSpec)},
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "BaseLayout",
            persistAuthorization: true
        });
        window.ui = ui;
    };
    </script>
</body>
</html>
  `.trim();

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
