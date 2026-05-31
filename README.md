# Wayfare — AI Trip Planner

A multi-user AI trip planner. Users sign up, describe a trip (destination, length, budget tier, interests), and a Gemini agent generates a day-by-day itinerary where **every activity carries a reasoning trace and a confidence score**. Users can edit activities and regenerate individual days with natural-language instructions — and regeneration is **constraint-aware**: it respects the remaining budget and avoids duplicating attractions across days.

- **Live app:** _<https://wayfare-five.vercel.app/>_
- **API:** _<https://wayfare-8iyv.onrender.com/>_ (`/health` returns `{ "ok": true }`)

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Backend | Express 5 + TypeScript (native ESM) |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT in httpOnly cookies + bcrypt |
| Validation | Zod (shared schemas — single source of truth) |
| LLM | Gemini 2.5 Flash via `@google/genai`, structured output with `responseJsonSchema` |
| PDF export | PDFKit (server-side itinerary export) |
| Deploy | Vercel (frontend) + Render (backend) |

## The creative feature: explainable, constraint-aware itineraries

Two things set this apart from a generic "ask an LLM for a trip" wrapper:

1. **Reasoning + confidence on every activity.** Each activity is stored with a one-line `reasoning` (why the agent picked it) and a `confidence` score (0.0–1.0), both surfaced in the UI. Low-confidence picks are visually flagged so the user knows what to scrutinize.
2. **Constraint-aware day regeneration.** When a user regenerates a single day, the agent receives the full trip context — remaining activities budget and the attractions already planned on other days — so it cannot blow the budget or stack four museums into one afternoon. The server also double-checks the returned cost against the computed budget.

The agent is intentionally **three discrete calls** (`generateTrip`, `regenerateDay`, `suggestHotels`), not one mega-prompt.

## Architecture

```
wayfare/
├── client/                 # Next.js 15 app (deployed to Vercel)
│   ├── app/
│   │   ├── (auth)/         # login, signup
│   │   └── (app)/          # dashboard, trips/new, trips/[id]
│   ├── components/         # trip-detail, regen-dialog, trip-card, ui, …
│   └── lib/                # api client, auth context, types, formatters
└── server/                 # Express API (deployed to Render)
    └── src/
        ├── config/         # env (Zod-validated), db connection
        ├── models/         # User, Trip (Mongoose)
        ├── middleware/     # requireAuth, validate, validateObjectId, errorHandler
        ├── routes/         # auth, trips
        ├── agent/          # gemini client, prompts, generateTrip, regenerateDay, suggestHotels, jsonSchema helper, withRetry
        ├── services/       # pdfExport
        └── shared/         # schemas.ts — Zod schemas shared by routes + agent
```

### API routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/signup` | Create user, set cookie |
| POST | `/auth/login` | Verify credentials, set cookie |
| POST | `/auth/logout` | Clear cookie |
| GET | `/auth/me` | Current user |
| GET | `/trips` | List the user's trips |
| POST | `/trips` | Create trip (runs `generateTrip` + `suggestHotels`) |
| GET | `/trips/:id` | Get one trip (ownership-checked) |
| GET | `/trips/:id/export` | Download the itinerary as a PDF |
| DELETE | `/trips/:id` | Delete a trip |
| POST | `/trips/:id/days/:dayNumber/regenerate` | Constraint-aware day regeneration |
| DELETE | `/trips/:id/days/:dayNumber/activities/:activityId` | Remove an activity |
| POST | `/trips/:id/days/:dayNumber/activities` | Add a manual activity |
| POST | `/trips/:id/hotels/refresh` | Re-fetch hotel suggestions |

## Design decisions

- **Express, not Next.js API routes.** Decouples the slow LLM work from page rendering and mirrors the Vercel/Render deployment split. Each side owns its dependencies.
- **Strict multi-tenant isolation.** Every Trip query is `Trip.findOne({ _id, userId: req.user.id })` — never `findById` alone. Cross-user access returns **404, not 403**, so we don't leak the existence of other users' resources.
- **JWT in httpOnly cookies, not localStorage.** httpOnly cookies can't be read by JavaScript, which closes the XSS token-theft vector. In production (cross-domain Vercel → Render) the cookie uses `sameSite: "none"` + `secure: true`, and the client sends `credentials: "include"`.
- **Zod as the single source of truth.** The same schemas drive Express request validation, the Gemini `responseJsonSchema`, and TypeScript types. Every LLM response is parsed and then validated with Zod — the schema is the final gate, even with structured output enabled.
- **Server-generated activity IDs.** Activity IDs come from `nanoid` on the server, never from the LLM, so IDs can't collide and edits stay predictable.
- **`responseJsonSchema`, not `responseSchema`.** The `@google/genai` SDK has two structured-output keys; `responseJsonSchema` takes standard JSON Schema (what we generate from Zod via a helper that strips the `$schema`/`additionalProperties` keys Gemini rejects). JSON-mode calls never pass `tools:` (that returns a 400).
- **Embedded itinerary, not a separate Activities collection.** The access pattern is always "read the whole trip, edit one activity," so embedding keeps it to one round-trip to Mongo. A separate collection would only help cross-trip activity search, which isn't a requirement.
- **Bounded retry (max 1) on LLM calls.** Transient errors and occasional malformed JSON are retried once; we don't retry forever — rate limits and cost matter.

## Running locally

You'll need Node 18+, a MongoDB Atlas connection string, and a Gemini API key.

**Backend**

```bash
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET (32+ chars), GEMINI_API_KEY
npm run dev            # http://localhost:4000
```

`server/.env`:

```bash
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=replace_with_64_char_random_string
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
CLIENT_ORIGIN=http://localhost:3000
COOKIE_DOMAIN=          # leave empty in dev
```

**Frontend**

```bash
cd client
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
npm run dev            # http://localhost:3000
```

> Secrets never go in `NEXT_PUBLIC_*` vars — those ship to the browser. The Gemini key and JWT secret live only on the server.

## Deployment

- **Backend → Render:** root directory `server`, build `npm install && npm run build`, start `npm start`. Set all `server/.env` vars with production values; `CLIENT_ORIGIN` must be the exact Vercel URL (no trailing slash).
- **Frontend → Vercel:** root directory `client`, framework auto-detected. Set `NEXT_PUBLIC_API_URL` to the Render URL.
- **MongoDB Atlas:** free M0 cluster, network access `0.0.0.0/0` (Render IPs are dynamic).

After both are live, confirm the cross-domain cookie persists (it relies on `sameSite: "none"` + `secure: true` on both HTTPS endpoints).

## Known limitations

- **Hotels are LLM-suggested, not booked.** No real hotel/availability API; suggestions are clearly labeled as such.
- **No automated tests.** Critical paths (cross-tenant isolation, auth, regen budget logic) were tested manually. A production version would add tests for the auth middleware and budget computation.
- **USD only.** No multi-currency support.
- **Single-user trips.** No collaborative editing or sharing.
- **Single agent, three calls.** No multi-agent orchestration.
- **Render free tier** cold-starts, so the first request after idle can be slow.

## License

See [LICENSE](LICENSE).
