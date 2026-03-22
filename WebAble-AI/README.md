# WebAble AI

Your 24/7 Autonomous AI-Powered Accessibility Auditor — powered by TinyFish.

## Features

- **Accessibility Audit** — WCAG compliance scanning via TinyFish with real-time SSE streaming
- **SEO Workspace** — 11 on-page SEO checks, scored out of 100. No API key required.
- **Vendor Security Audit** — TinyFish-powered privacy/security audit with MongoDB storage and PDF download
- **Swagger Docs** — Full API documentation at `/api/docs`

## Quick Start

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Ki55n/WebAble-AI.git
cd WebAble-AI

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in your API keys in .env.local

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker (Recommended for Production)

```bash
# 1. Set up environment
cp .env.example .env.local
# Fill in your API keys in .env.local
# Note: MONGODB_URI is set automatically by docker-compose

# 2. Build and run
docker-compose up --build

# 3. Stop
docker-compose down
```

## Environment Variables

See `.env.example` for all required variables with descriptions.

| Variable | Required | Description |
|---|---|---|
| `TINYFISH_API_KEY` | ✅ | TinyFish web agent API key |
| `GEMINI_API_KEY` | ✅ | Google Gemini 2.5 Flash API key |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens |
| `DEMO_LOGIN_EMAIL` | ✅ | Demo email for vendor audit login |
| `DEMO_LOGIN_PASSWORD` | ✅ | Demo password for vendor audit login |
| `DEMO_LOGIN_USER_ID` | ✅ | Demo user ID for vendor audit login |
| `NEXT_PUBLIC_BASE_URL` | Optional | App URL for metadata |

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/audit` | Accessibility audit workspace |
| `/seo` | SEO analysis workspace |
| `/vendor-audit` | Vendor security audit with PDF reports |
| `/api/docs` | Swagger API documentation |

## Tech Stack

- **Frontend** — Next.js 16, React 19, Tailwind CSS 4, Framer Motion
- **AI / Agents** — TinyFish Web Agent, Google Gemini 2.5 Flash
- **Database** — MongoDB with Mongoose
- **Auth** — JWT (jsonwebtoken)
- **PDF** — pdf-lib
- **Infrastructure** — Docker, docker-compose, MongoDB 7
