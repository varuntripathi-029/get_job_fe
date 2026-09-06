# HireSignal — Frontend

Web client for **HireSignal**, an AI hiring intelligence platform that computes explainable hiring momentum scores for companies from public signals.

> Backend lives in a separate repo: [get_job_be](https://github.com/varuntripathi-029/get_job_be)

## What HireSignal does

HireSignal monitors companies using public signals — career pages, funding announcements, engineering blogs, news, and ATS APIs — and turns them into a hiring momentum score backed by linked evidence.

It is **not** a job portal, and it never claims a company *will* hire. The strongest claim it makes is:

> "Based on recent public activity, Company X shows strong hiring signals."

The UI's job is to make that claim auditable: every score a user sees links back to the evidence behind it.

## Status

Built and deployed. The whole client is here — companies, jobs, events, search, resume matching, a newsletter, and an admin console — running on Vercel against the live backend. It's a solo project on free infrastructure, so how much data shows up depends on how much crawling the backend has been able to afford. The app itself is done.

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
| Animation | GSAP |
| Package manager | **npm** |

No component library — no shadcn, MUI, or Ant Design. Every component is built in-repo, which is more work up front and the reason the whole thing has one coherent look instead of three libraries' worth of defaults fighting each other.

## Authentication

Google OAuth 2.0 **only**. There are no password fields anywhere in the app.

The app renders a Google sign-in button, receives a Google ID token, and exchanges it at `POST /auth/google` on the backend for a JWT access + refresh token pair. The JWT is stored in `localStorage` and attached as a Bearer token by an Axios interceptor on every subsequent request.

## Local setup

Requires Node 18+ and npm. The backend should be running at `http://localhost:8000`.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env      # then fill in the blanks

# 3. Run the dev server
npm run dev
```

The app will be at `http://localhost:5173`.

## Scripts

```bash
npm run dev        # dev server with HMR
npm run build      # type-check and build for production
npm run preview    # preview the production build locally
npm run lint       # run oxlint
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

## The stuff that fought back

A few things on the frontend were more stubborn than they had any right to be.

**Not looking like a template.** The dark theme started as charcoal with a green tint and read exactly like every AI-generated dashboard on the internet — that vaguely gradient, vaguely teal look you've seen a hundred times. So we threw it out and used Spotify's actual palette: a deep near-black (`#191414`) with one confident green, black text on the green buttons. Same components, completely different feel. Contrast stays at AA or better everywhere, because a moody theme you can't read is just a worse theme.

**The torch that followed your cursor.** We pulled in React Bits' MagicBento card effect — border glow, drifting particles, a click ripple. The first cut had one big spotlight trailing the mouse across the whole page, which looked less "premium card" and more "someone's holding a flashlight." The fix was to make each card light its *own* border as you hover it, following the cursor along that card's edge. It's on the card now, where it belongs, instead of roaming the page.

**Transforms fighting each other.** Adding tilt and magnetism to cards that already had a CSS hover-lift meant two different things writing `transform` at the same time, which janks visibly. So the cards that tilt hand the transform entirely to the animation and drop the CSS lift; the calmer cards keep the lift and just take the glow. The whole effect switches off on touch and reduced-motion — a hover animation on a device with no hover is wasted battery and nothing else.

**Keeping the navbar we already liked.** PillNav's animated pill-fill hover is lovely, but the component it ships in is a whole floating nav bar — no search, no theme toggle, no account menu, none of the things the real navbar already did well. So we lifted just the pill animation into the existing links rather than swapping the bar out. New trick, same navbar.

**An admin console that could actually admin.** The source table quietly grew past what the UI could handle — you could approve and reject, but not delete, disable, re-tier, or even find one specific source among hundreds. That's fixed: search by company or URL, and per-row actions to re-detect the fetch tier, disable, enable, delete, and force a crawl. It turned out most of the "why is nothing showing for this company" debugging was one button away the entire time — the buttons just didn't exist yet.
