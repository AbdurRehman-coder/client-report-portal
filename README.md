# AW Client Report Portal

Internal quarterly reporting portal for Anderson Wealth Management / Windbrook Solutions.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: set PORTAL_PASSWORD and NEXTAUTH_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your portal password.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite path, e.g. `file:./dev.db` |
| `PORTAL_PASSWORD` | Password for the internal portal login page |
| `NEXTAUTH_SECRET` | Random secret for session signing (`openssl rand -base64 32`) |

## Changing the portal password

Set `PORTAL_PASSWORD` in your `.env` (or Vercel env vars) and restart. Sessions are `httpOnly` cookies that expire in 7 days.

## Deploying to Vercel

> **Important:** Puppeteer does not work on Vercel's standard Node.js runtime. Before deploying, switch to the serverless-compatible Chromium binary:
>
> 1. `npm install @sparticuz/chromium puppeteer-core && npm uninstall puppeteer`
> 2. Update `lib/pdf-generator.ts`:
>
> ```typescript
> import chromium from '@sparticuz/chromium'
> import puppeteer from 'puppeteer-core'
>
> export async function generatePdfFromHtml(html: string): Promise<Buffer> {
>   const browser = await puppeteer.launch({
>     args: chromium.args,
>     defaultViewport: chromium.defaultViewport,
>     executablePath: await chromium.executablePath(),
>     headless: chromium.headless,
>   })
>   // rest of function unchanged
> }
> ```

### Deploy steps

```bash
vercel --prod
```

Set in the Vercel dashboard: `DATABASE_URL`, `PORTAL_PASSWORD`, `NEXTAUTH_SECRET`.  
The PDF endpoint has a 30-second timeout configured in `vercel.json`.

## Scripts

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build + TypeScript check
npm run start   # run production build locally
```
