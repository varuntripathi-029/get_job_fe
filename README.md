# HireSignal — Frontend

Web client for **HireSignal**, an AI hiring intelligence platform that computes explainable hiring momentum scores for companies from public signals.

> Backend lives in a separate repo: [get_job_be](https://github.com/varuntripathi-029/get_job_be)

## What HireSignal does

HireSignal monitors companies using public signals — career pages, funding announcements, engineering blogs, news, and ATS APIs — and turns them into a hiring momentum score backed by linked evidence.

It is **not** a job portal, and it never claims a company *will* hire. The strongest claim it makes is:

> "Based on recent public activity, Company X shows strong hiring signals."

The UI's job is to make that claim auditable: every score a user sees links back to the evidence behind it.

## Status

🚧 **Pre-development.** This repo currently contains project configuration only. No application code yet.

## Tech stack

| Area | Choice |
|---|---|
| Framework | React 18+ |
| Language | TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| HTTP | Axios |
| Auth | @react-oauth/google |
| Package manager | **pnpm** |

No component library — no shadcn, MUI, or Ant Design. Components are built in-repo.

## Authentication

Google OAuth 2.0 **only**. There are no password fields anywhere in the app.

The app renders a Google sign-in button, receives a Google ID token, and exchanges it at `POST /auth/google` on the backend for a JWT access + refresh token pair. The JWT is stored in `localStorage` and attached as a Bearer token by an Axios interceptor on every subsequent request.

## Local setup

Requires [pnpm](https://pnpm.io/) and Node 18+. The backend should be running at `http://localhost:8000`.

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env      # then fill in the blanks

# 3. Run the dev server
pnpm dev
```

The app will be at `http://localhost:5173`.

## Scripts

```bash
pnpm dev        # dev server with HMR
pnpm build      # type-check and build for production
pnpm preview    # preview the production build locally
pnpm lint       # run ESLint
```

## Environment variables

Copy `.env.example` to `.env` and fill it in. `.env` is gitignored and must never be committed.

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL (defaults to `http://localhost:8000`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID, must match the backend's |

Vite inlines every `VITE_*` variable into the client bundle, so only put values here that are safe to ship publicly. The Google client ID is safe; the client *secret* is not and lives only in the backend.

## Project structure

```
src/
├── components/   # shared components
├── pages/        # route pages
├── hooks/        # custom hooks
├── lib/          # API client, utilities, shared types
├── layouts/      # layout components
└── App.tsx       # router setup
```

Path alias `@/` resolves to `src/`.
