# VedaAI Assessment Creator

An AI-powered question paper generator for teachers. Upload source material (PDF or TXT), configure a question distribution, and watch a structured exam paper build itself in real time — complete with answers, difficulty labels, and a downloadable PDF.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Directory Structure](#directory-structure)
5. [Data & Control Flow](#data--control-flow)
6. [Key Design Decisions](#key-design-decisions)
7. [Environment Variables](#environment-variables)
8. [Local Setup](#local-setup)
9. [Available Scripts](#available-scripts)
10. [API Reference](#api-reference)
11. [WebSocket Protocol](#websocket-protocol)
12. [Validation Rules](#validation-rules)
13. [Rate Limiting](#rate-limiting)
14. [PDF Generation Approach](#pdf-generation-approach)
15. [AI Prompting & Parsing Approach](#ai-prompting--parsing-approach)
16. [Authentication](#authentication)
17. [Caching Strategy](#caching-strategy)
18. [Troubleshooting](#troubleshooting)

---

## Features

- Upload a PDF or TXT file as source material for question generation
- Configure question types (MCQ, Short, Long, Diagram, Numerical), counts, and marks per question
- Real-time job progress streamed to the UI via WebSockets
- AI-generated structured question paper with sections, difficulty badges, and an answer key
- Server-side PDF rendered without any third-party PDF service — pure custom PDF binary
- Per-user rate limiting (5 generations per day) backed by Redis
- Clerk-based authentication on both frontend and backend
- Zustand stores for client-side state; Redis for server-side caching

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Client state | Zustand 5 |
| Auth (client) | `@clerk/nextjs` |
| Toast notifications | Sonner |
| Backend framework | Express 4, TypeScript, Node.js |
| Database | MongoDB via Mongoose 8 |
| Cache / queue broker | Redis 7 via ioredis |
| Job queue | BullMQ 5 |
| Auth (server) | `@clerk/clerk-sdk-node` |
| AI model | Google Gemini 2.5 Flash via Vercel AI SDK (`ai`, `@ai-sdk/google`) |
| Real-time | WebSocket (`ws` library, native browser WebSocket) |
| File parsing | `pdf-parse`, Node.js `fs` |
| Infrastructure | Docker Compose (Redis + MongoDB optional) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Dashboard   │  │  Create Form     │  │  Output Page     │  │
│  │  Page        │  │  Page            │  │  Page            │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘  │
│         │                   │ multipart POST        │            │
│  Zustand Stores: useAssignmentsStore, useAssignmentBuilderStore  │
│  useGenerationSocketStore ←─────────────── WebSocket ◄──────┐  │
└───────────────────────────────────────────┬──────────────────┼──┘
                                            │ HTTP             │ WS
┌───────────────────────────────────────────▼──────────────────┼──┐
│                     Express Backend                           │  │
│                                                               │  │
│  ┌────────────────┐   ┌──────────────┐   ┌────────────────┐  │  │
│  │  /api/         │   │  BullMQ      │   │  WebSocket     │──┘  │
│  │  assignments   │   │  Generation  │   │  Server        │     │
│  │  (REST routes) │   │  Queue       │   │  (socketMgr)   │     │
│  └────────┬───────┘   └──────┬───────┘   └────────────────┘     │
│           │ enqueue job      │ worker                            │
│           ▼                  ▼                                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │              Services Layer                      │           │
│  │  aiService  │  pdfService  │  assignmentCache    │           │
│  │  promptBuilder │ assignmentSerializer             │           │
│  └──────┬──────────────┬──────────────┬─────────────┘           │
│         │              │              │                          │
│         ▼              ▼              ▼                          │
│    Google Gemini    Filesystem     Redis (cache)                 │
│    (via AI SDK)    (PDF files)     MongoDB (persist)             │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Layer

The frontend is a Next.js App Router application with three primary screens:

- **Dashboard (`/`)** — lists all assignments for the signed-in teacher, supports text search, and shows skeleton loaders during fetch.
- **Create Assignment (`/assignments/new`)** — a form with file upload (drag-and-drop), due date, question type editor, and additional instructions. On submit it fires a `multipart/form-data` POST and immediately redirects to the output page.
- **Assignment Output (`/assignments/:id`)** — shows the rendered question paper once generated, with action buttons to regenerate or download the server-generated PDF. Subscribes to a WebSocket channel for live status updates.

State is split across three Zustand stores:

| Store | Responsibility |
|---|---|
| `useAssignmentsStore` | Fetched assignments list, current assignment, loading/error states |
| `useAssignmentBuilderStore` | In-progress create-form state (persists across re-renders, reset on submit) |
| `useGenerationSocketStore` | WebSocket lifecycle, last received message |

### Backend Layer

The backend is a single Express application that bootstraps MongoDB, Redis, BullMQ workers, and a WebSocket server on the same Node.js `http.Server` instance.

**Request handling** (routes layer) validates incoming payloads with Zod, persists to MongoDB, queues a BullMQ job, writes an initial cache entry to Redis, and responds immediately. It does not block on AI generation.

**Worker layer** runs asynchronously in-process:

- `generationWorker` — dequeues paper-generation jobs, calls Gemini via `generateObject()`, saves the structured result to MongoDB, then enqueues a PDF job.
- `pdfWorker` — dequeues PDF jobs, renders a binary PDF from the structured paper, writes it to `backend/generated-pdfs/`, updates MongoDB, and broadcasts the completion over WebSocket.

After every state change both workers call `broadcastAssignmentUpdate()` so the frontend stays in sync without polling.

---

## Directory Structure

```
krishbansal-2205-academia-ai/
├── docker-compose.yml          # Redis container (MongoDB optional)
├── .env.example                # Root-level env template
│
├── backend/
│   ├── src/
│   │   ├── index.ts            # Server bootstrap
│   │   ├── config/
│   │   │   ├── database.ts     # Mongoose connect with retry
│   │   │   ├── env.ts          # Typed env config + dotenv loader
│   │   │   └── redis.ts        # Singleton ioredis client
│   │   ├── middleware/
│   │   │   └── rateLimiter.ts  # Redis-backed daily rate limiter
│   │   ├── models/
│   │   │   └── Assignment.ts   # Mongoose schema + model
│   │   ├── queues/
│   │   │   ├── generationQueue.ts  # BullMQ queue definition
│   │   │   ├── generationWorker.ts # AI generation job processor
│   │   │   ├── pdfQueue.ts         # BullMQ PDF queue definition
│   │   │   └── pdfWorker.ts        # PDF job processor
│   │   ├── routes/
│   │   │   └── assignments.ts  # All REST endpoints
│   │   ├── services/
│   │   │   ├── aiService.ts           # Gemini generateObject() call
│   │   │   ├── assignmentCache.ts     # Redis get/set helpers
│   │   │   ├── assignmentSerializer.ts # Mongoose doc → API shape
│   │   │   ├── pdfService.ts          # Custom PDF binary builder
│   │   │   └── promptBuilder.ts       # Structured prompt assembler
│   │   ├── types/
│   │   │   └── index.ts        # Shared TypeScript interfaces
│   │   └── websocket/
│   │       └── socketManager.ts # WS server init + broadcast
│   ├── uploads/                # Uploaded source files (runtime)
│   ├── generated-pdfs/         # Output PDFs (runtime)
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── middleware.ts        # Clerk route protection
    │   ├── app/
    │   │   ├── layout.tsx       # ClerkProvider + Toaster
    │   │   ├── page.tsx         # Dashboard entry
    │   │   └── assignments/
    │   │       ├── [id]/page.tsx      # Output page entry
    │   │       └── new/page.tsx       # Create page entry
    │   ├── components/
    │   │   ├── assignments/     # Card, empty state, paper preview, type editor
    │   │   ├── pages/           # Dashboard, create, output page components
    │   │   └── shell/           # AppShell: sidebar + mobile nav + top bar
    │   ├── hooks/
    │   │   └── use-assignment-subscription.ts  # WS + store wiring hook
    │   ├── lib/
    │   │   ├── api.ts           # Typed fetch wrappers with Clerk auth header
    │   │   └── types.ts         # Shared frontend types + constants
    │   └── stores/              # Zustand stores (see above)
    ├── package.json
    └── tsconfig.json
```

---

## Data & Control Flow

```
Teacher fills form
      │
      ▼
POST /api/assignments  (multipart: file + JSON fields)
      │
      ├─ Validate with Zod
      ├─ Extract text from PDF/TXT (pdf-parse / fs.readFileSync)
      ├─ Infer title/subject if blank
      ├─ Create MongoDB assignment  { status: 'processing' }
      ├─ Cache in Redis (30 min TTL)
      ├─ Enqueue BullMQ generation job
      └─ Respond 201 → frontend redirects to /assignments/:id
                                           │
                                           ▼
                              Output page mounts
                                           │
                              useAssignmentSubscription
                                           │
                              WebSocket connect + subscribe
                                           │
      ┌────────────────────────────────────┘
      │  (async, in BullMQ worker)
      ▼
generationWorker picks up job
      │
      ├─ Set status = 'processing', broadcast
      ├─ buildPrompt(assignment) → structured text prompt
      ├─ generateObject({ model: gemini-2.5-flash, schema: Zod })
      │         → { institutionName, examTitle, sections[], ... }
      ├─ Save generatedPaper to MongoDB
      ├─ Set status = 'completed', pdfStatus = 'processing'
      ├─ broadcast → frontend shows question paper immediately
      └─ Enqueue BullMQ PDF job
                │
                ▼
      pdfWorker picks up job
                │
                ├─ buildDocumentCommands(paper) → RenderCommand[]
                ├─ paginate(commands)           → string[] (page streams)
                ├─ buildPdfBuffer(pageStreams)   → Buffer
                ├─ Write to generated-pdfs/:id.pdf
                ├─ Set pdfStatus = 'completed', save pdfPath
                └─ broadcast → frontend enables "Download PDF" button
```

---

## Key Design Decisions

### Structured AI Output via `generateObject()`

Rather than asking Gemini to return raw text and parsing it with regex, the backend uses the Vercel AI SDK's `generateObject()` with a Zod schema. This forces the model to return a validated object matching the exact shape needed by both the question paper renderer and the PDF service. If Gemini returns malformed output, Zod throws and the job fails cleanly — no partial garbage gets persisted.

### Custom PDF Binary — No Third-Party Library

`pdfService.ts` constructs a valid PDF 1.4 binary from scratch using string buffers, manual cross-reference tables, and Type1 fonts (Helvetica / Helvetica-Bold). This avoids pulling in large PDF libraries (PDFKit, jsPDF) and gives full control over layout. Text wrapping, pagination, two-column option layout for MCQs, and horizontal rules are all handled in roughly 350 lines of TypeScript.

### Background Jobs via BullMQ

AI generation can take 10–30 seconds. Blocking an HTTP connection that long would be brittle. BullMQ offloads the work to a background worker that:
- Retries up to 3 times on transient AI errors (exponential back-off)
- Runs at most 2 concurrent generation jobs (configurable concurrency)
- Limits to 5 jobs per minute (BullMQ rate limiter)

### Redis for Two Purposes

Redis serves as both a job broker (BullMQ) and an application cache:
- Individual assignment cache: `assignment:{userId}:{id}` — 30-minute TTL
- Assignment list cache: `assignments:list:{userId}` — invalidated on any write
- Job state snapshot: `assignment:{id}:job-state` — 6-hour TTL for recovery

### WebSocket for Live Updates

HTTP polling would require the client to guess a safe interval and risk hammering the server. Instead, each output page subscribes to a WebSocket channel keyed by assignment ID. Workers call `broadcastAssignmentUpdate()` after every state change, so the UI transitions from "Generating..." → paper preview → "PDF ready" without any client-side polling.

---

## Environment Variables

Copy the root `.env.example` to `.env` at the project root, then fill in the required values.

```
# ─── Shared ────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── MongoDB ───────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/vedaai
# or a MongoDB Atlas connection string

# ─── Redis ─────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ─── Google Gemini ─────────────────────────────────────────────
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
# Obtain from https://aistudio.google.com/app/apikey

# ─── CORS ──────────────────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000

# ─── Clerk (backend) ───────────────────────────────────────────
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# ─── Clerk (frontend) ──────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# ─── Frontend API/WS endpoints ─────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

> **Required** before the backend will start without warnings: `MONGODB_URI`, `REDIS_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, `CLERK_SECRET_KEY`.

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm 9+ (or pnpm / yarn)
- Docker Desktop (for Redis)
- A [Clerk](https://clerk.com) account (free tier is sufficient)
- A Google AI Studio API key for Gemini

### Step 1 — Clone & configure

```bash
git clone <repo-url>
cd krishbansal-2205-academia-ai
cp .env.example .env
# Edit .env and fill in all required values
```

### Step 2 — Start infrastructure

```bash
# Starts Redis on port 6379
docker compose up -d
```

If you want MongoDB via Docker as well, add this service to `docker-compose.yml`:

```yaml
mongodb:
  image: mongo:7
  container_name: vedaai-mongo
  ports:
    - '27017:27017'
  volumes:
    - mongo_data:/data/db
  restart: unless-stopped

volumes:
  redis_data:
  mongo_data:
```

### Step 3 — Start the backend

```bash
cd backend
npm install
npm run dev
```

The backend starts at `http://localhost:5000`.  
Verify: `curl http://localhost:5000/api/health`

### Step 4 — Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:3000`.

### Step 5 — Verify

Open `http://localhost:3000`, sign in with Clerk, and create a test assignment.

---

## Available Scripts

### Backend (`cd backend`)

| Command | Description |
|---|---|
| `npm run dev` | Start with `ts-node-dev` (hot reload) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled output (`node dist/index.js`) |

### Frontend (`cd frontend`)

| Command | Description |
|---|---|
| `npm run dev` | Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint check |
| `npx tsc --noEmit` | TypeScript type check without emitting |

---

## API Reference

All routes require a valid Clerk JWT in the `Authorization: Bearer <token>` header.

### Assignments

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/assignments` | Create an assignment (multipart/form-data) |
| `GET` | `/api/assignments` | List all assignments for the authenticated user |
| `GET` | `/api/assignments/:id` | Fetch a single assignment |
| `POST` | `/api/assignments/:id/regenerate` | Re-run AI generation with the same settings |
| `POST` | `/api/assignments/:id/pdf` | Queue a (re)generation of the PDF |
| `GET` | `/api/assignments/:id/pdf/download` | Download the completed PDF file |
| `DELETE` | `/api/assignments/:id` | Delete an assignment and its generated PDF |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{ status: "ok", timestamp, uptime }` |

### `POST /api/assignments` — Request Body

Sent as `multipart/form-data`:

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | Yes | PDF or TXT, max 10 MB |
| `dueDate` | string (ISO date) | Yes | e.g. `2025-06-30` |
| `questionTypes` | JSON string | Yes | Array of `{type, count, marks}` |
| `title` | string | No | Inferred from filename if omitted |
| `subject` | string | No | Inferred from instructions/content if omitted |
| `additionalInstructions` | string | No | Up to 2000 characters |
| `totalQuestions` | number | No | Recalculated from `questionTypes` server-side |
| `totalMarks` | number | No | Recalculated from `questionTypes` server-side |

### Assignment Status Fields

| Field | Values | Meaning |
|---|---|---|
| `status` | `draft` / `processing` / `completed` / `failed` | AI generation pipeline state |
| `pdfStatus` | `idle` / `processing` / `completed` / `failed` | PDF rendering pipeline state |

---

## WebSocket Protocol

Connect to `ws://localhost:5000`.

### Client → Server

```json
{
  "type": "subscribe",
  "assignmentId": "<mongo-id>",
  "token": "<clerk-jwt>"
}
```

The token is verified server-side with `@clerk/clerk-sdk-node` `verifyToken()`. Invalid tokens cause the connection to close immediately.

### Server → Client

**Subscription confirmed:**
```json
{
  "type": "subscribed",
  "assignmentId": "<mongo-id>"
}
```

**State update (sent immediately on subscribe, then after every worker change):**
```json
{
  "type": "assignment:update",
  "assignmentId": "<mongo-id>",
  "assignment": { /* full AssignmentResponse object */ },
  "message": "Generating question paper"
}
```

Possible `message` strings: `"Generating question paper"`, `"Question paper ready, preparing PDF"`, `"Preparing PDF"`, `"PDF ready"`, `"Generation failed"`, `"PDF generation failed"`.

---

## Validation Rules

### File Upload
- Accepted MIME types: `application/pdf`, `text/plain`
- Maximum size: 10 MB
- Required to create an assignment

### Question Types
- At least one question type must be present
- `count` must be a positive integer ≥ 1
- `marks` must be a positive integer ≥ 1
- Each `type` can only appear once per assignment

### Due Date
- Required — must be a valid date parseable by `new Date()`

### Text Fields
- `title`: max 120 characters (optional — inferred if blank)
- `subject`: max 80 characters (optional — inferred if blank)
- `additionalInstructions`: max 2000 characters

---

## Rate Limiting

Implemented in `backend/src/middleware/rateLimiter.ts` using Redis atomic `INCR` + `EXPIRE`:

- **Limit:** 5 assignment generations per user per calendar day (UTC)
- **Key pattern:** `rate_limit:{userId}:{YYYY-MM-DD}`
- **Fail-open:** if Redis is unavailable, the request proceeds to avoid blocking teachers
- **Response on exceeded limit:** `HTTP 429` with a descriptive error message

---

## PDF Generation Approach

`pdfService.ts` builds a valid PDF 1.4 document entirely in memory without any external library.

### Pipeline

```
IGeneratedPaper
      │
      ▼
buildDocumentCommands()  →  RenderCommand[]
      │   Header, time/marks row, instructions,
      │   student fields, sections, questions,
      │   MCQ options (two-column), answer key
      ▼
paginate()  →  string[]  (one PDF content stream per page)
      │   Tracks Y-cursor, breaks pages when content
      │   would exceed MARGIN_BOTTOM (64pt)
      ▼
buildPdfBuffer()  →  Buffer
      │   Writes PDF objects, cross-reference table,
      │   trailer and %%EOF — valid PDF 1.4
      ▼
fs.writeFileSync(generated-pdfs/:id.pdf)
```

### Layout Constants

| Constant | Value | Purpose |
|---|---|---|
| `PAGE_WIDTH` | 595 pt | A4 width |
| `PAGE_HEIGHT` | 842 pt | A4 height |
| `MARGIN_X` | 56 pt | Left/right margin |
| `MARGIN_TOP` | 780 pt | Top content start Y |
| `MARGIN_BOTTOM` | 64 pt | Page break trigger Y |

Fonts used: `Helvetica` (F1, regular) and `Helvetica-Bold` (F2), both standard Type1 — no font embedding required.

---

## AI Prompting & Parsing Approach

### Prompt Structure (`promptBuilder.ts`)

The prompt sent to Gemini is assembled in plain text sections:

1. Role declaration ("expert school assessment designer")
2. Exam brief — title, subject, total questions, total marks, due date
3. Question type distribution — human-readable breakdown per type
4. Difficulty mix targets — 30% Easy / 50% Moderate / 20% Hard
5. Output rules — grouping into sections, MCQ option count, diagram descriptions, answer format
6. Teacher instructions (if provided)
7. Reference material — uploaded file text, truncated to 14,000 characters

### Structured Parsing (`aiService.ts`)

`generateObject()` from the Vercel AI SDK is called with a nested Zod schema:

```
GeneratedPaperSchema
  ├── institutionName, examTitle, subject, className
  ├── duration, totalMarks, date, generalInstructions
  └── sections[]
        ├── title, instruction
        └── questions[]
              ├── number, text, type, difficulty
              ├── marks, answer
              └── options[]  (MCQ only)
```

The model is forced to conform to this exact shape. No raw text is ever written to the database or rendered directly in the UI — only the validated, parsed object.

---

## Authentication

The project uses [Clerk](https://clerk.com) for both frontend and backend.

### Frontend

`@clerk/nextjs` wraps the app in `ClerkProvider`. The middleware in `src/middleware.ts` protects all `/assignments/*` routes. `SignInButton` and `UserButton` are rendered in the shell.

API calls include a JWT obtained from `window.Clerk.session.getToken()` as a `Authorization: Bearer` header.

### Backend

Every route uses `ClerkExpressRequireAuth()` middleware from `@clerk/clerk-sdk-node`. The WebSocket subscribe handler calls `verifyToken()` directly to authenticate subscription requests. The `userId` extracted from the JWT is used to scope all MongoDB queries and Redis cache keys, ensuring strict data isolation between users.

---

## Caching Strategy

| Cache Key | TTL | Content | Invalidated when |
|---|---|---|---|
| `assignment:{userId}:{id}` | 30 min | Full `AssignmentResponse` | Assignment is updated or deleted |
| `assignments:list:{userId}` | 30 min | `AssignmentResponse[]` | Any assignment is created, updated, or deleted |
| `assignment:{id}:job-state` | 6 hours | `{ status, pdfStatus, updatedAt }` | Never (overwritten on each update) |
| `rate_limit:{userId}:{date}` | 24 hours | Integer counter | Expires automatically at midnight UTC |

Cache reads happen before every MongoDB query in GET routes. On a cache miss, the response is written back to Redis so subsequent reads within the TTL window skip the database entirely.

---
