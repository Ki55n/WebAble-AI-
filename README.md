This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Vendor Audit API (TinyFish + Reports)

The app now includes a Next.js-native vendor security audit flow backed by
TinyFish, JWT auth, MongoDB persistence, and PDF report downloads.

### Required environment variables

Add these to `.env`:

```bash
TINYFISH_API_KEY=your_tinyfish_api_key
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_signing_secret
```

Optional demo login overrides:

```bash
DEMO_LOGIN_EMAIL=test@vendorshield.com
DEMO_LOGIN_PASSWORD=pass
DEMO_LOGIN_USER_ID=user123
```

### API Documentation

The full API documentation is available at `/api/docs`. It provides detailed information on:
- Authentication
- Vendor security audits (SSE stream)
- Report management and PDF downloads
- Yutori browser agent tasks
- Linear and AI integrations

### Routes

- `GET /api/docs` (Swagger UI)
- `POST /api/auth/login` and `POST /api/login`
- `POST /api/audit` (auth required, SSE stream; final event type: `audit_saved`)
- `GET /api/reports` (auth required)
- `GET /api/reports/:id` (auth required)
- `GET /api/reports/:id/download` (auth required)
- `GET /api/report/:id/download` (compatibility path)

## Running with Docker

1. **Copy the environment example file:**
   ```bash
   cp .env.example .env
   ```
2. **Fill in the values in `.env`:**
   Open `.env` and provide your API keys and secrets.
3. **Build and start the application:**
   ```bash
   docker compose up --build
   ```
   Docker Compose automatically picks up variables from the `.env` file in the same directory. Note that the application inside Docker connects to the MongoDB container using `mongodb:27017`. You don't need to change `MONGODB_URI` in your `.env` for Docker runs, as it is handled automatically in `docker-compose.yml`.

### Troubleshooting Connection Errors

If you see an error like `connect ECONNREFUSED ::1:27017` or `127.0.0.1:27017`, it means your application is trying to connect to its own `localhost` instead of the database container.

1. Ensure you are using the latest `docker-compose.yml` which points `MONGODB_URI` to `mongodb:27017`.
2. If you are overriding variables, make sure you don't pass `MONGODB_URI=mongodb://localhost:27017` to the Docker container, as `localhost` inside a container refers to the container itself.

### Passing Environment Variables Manually

If you don't want to use a `.env` file, you can pass variables directly via the shell:
```bash
GEMINI_API_KEY=your_key docker compose up
```

## UI

A dedicated page is available at `/vendor-audit` to:

- sign in with demo credentials
- run vendor audits
- view saved reports
- download PDF reports
