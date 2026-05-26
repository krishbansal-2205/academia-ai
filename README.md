# VedaAI Assessment Creator

An AI-powered assessment builder for teachers, implemented with a Next.js frontend and an Express + TypeScript backend. The app lets a teacher upload source material, configure question distribution, generate a structured paper with Gemini through the Vercel AI SDK, watch live job updates over WebSockets, and download the final paper as a backend-generated PDF.

## Stack

- Frontend: Next.js 16, TypeScript, Tailwind CSS, Zustand, WebSocket client
- Backend: Node.js, Express, TypeScript, MongoDB, Redis, BullMQ, WebSocket server
- AI: Google Gemini via `ai` and `@ai-sdk/google`

## Architecture Overview

### Frontend

- `frontend/src/components/pages`
  Contains the three primary screens:
  - assignments dashboard
  - create assignment flow
  - assignment output view
- `frontend/src/stores/use-assignment-builder-store.ts`
  Holds the teacher’s in-progress form state in Zustand.
- `frontend/src/stores/use-assignments-store.ts`
  Stores fetched assignments and keeps the active assignment in sync.
- `frontend/src/stores/use-generation-socket-store.ts`
  Centralizes WebSocket lifecycle and subscriptions.
- `frontend/src/hooks/use-assignment-subscription.ts`
  Subscribes the active output page to backend assignment updates and patches Zustand state live.

### Backend

- `backend/src/routes/assignments.ts`
  Validates multipart assignment creation, lists assignments, regenerates papers, and exposes PDF endpoints.
- `backend/src/queues/generationWorker.ts`
  Processes AI paper generation jobs in BullMQ.
- `backend/src/queues/pdfWorker.ts`
  Processes PDF generation jobs in BullMQ after the paper is ready.
- `backend/src/services/aiService.ts`
  Uses Gemini with a Zod schema so the LLM output is parsed into a stable structure instead of being rendered raw.
- `backend/src/services/pdfService.ts`
  Creates a formatted PDF file on the server from the structured paper model.
- `backend/src/services/assignmentCache.ts`
  Stores assignment and job-state snapshots in Redis for faster reads and live-status recovery.
- `backend/src/websocket/socketManager.ts`
  Manages assignment-specific WebSocket subscriptions and broadcasts live updates to the frontend.

## End-to-End Flow

1. Teacher fills the assignment form and uploads a PDF or TXT file.
2. Frontend sends a multipart request to `POST /api/assignments`.
3. Backend validates the payload, extracts text from the uploaded material, creates a MongoDB assignment record, caches the initial response in Redis, and enqueues a BullMQ generation job.
4. The generation worker builds a structured prompt, calls Gemini, stores the parsed paper in MongoDB, updates Redis job state, broadcasts the assignment update, and then enqueues a PDF job.
5. The PDF worker renders a downloadable PDF file, stores its file path, updates Redis, and broadcasts the refreshed assignment state.
6. The output page listens on WebSocket, updates automatically, and enables the PDF download button once the backend PDF is ready.

## Prompting and Parsing Approach

- The teacher input is converted into a structured prompt with:
  - title
  - subject
  - due date
  - question distribution
  - difficulty guidance
  - additional instructions
  - uploaded reference material
- Gemini is called with `generateObject()` and a Zod schema.
- The response is forced into:
  - general paper metadata
  - sections
  - questions
  - difficulty labels
  - marks
- Because the app only renders the parsed object, it avoids dumping raw model text into the UI.

## UI Approach

- The layout mirrors the Figma intent with:
  - desktop sidebar and floating top bar
  - mobile header and bottom navigation
  - soft grayscale gradient background
  - rounded white cards with exam-style spacing
- The output page uses a paper-like layout with:
  - student info lines
  - centered section headings
  - instruction blocks
  - difficulty badges
  - marks badges

## Validation

- File type limited to PDF or TXT
- File size limited to 10MB
- Due date required
- Question counts and marks must be positive
- Question types must contain at least one valid section
- Backend also recalculates total questions and marks from the submitted question-type rows

## Local Setup

1. Copy `.env.example` to `.env`.
2. Start MongoDB and Redis with Docker:

```bash
docker compose up -d
```

3. Start the backend:

```bash
cd backend
npm install
npm run dev
```

4. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Useful URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- WebSocket: `ws://localhost:5000`

## Verification

- Backend TypeScript build: `cd backend && npm run build`
- Frontend TypeScript check: `cd frontend && npx tsc --noEmit`
- Frontend lint: `cd frontend && npm run lint`

## Notes

- The frontend `next build` step compiled successfully in this environment, but Next.js’s final Windows worker process hit a local `spawn EPERM`. A direct TypeScript check and lint both passed, so the implementation itself is type-safe.
- If `title` or `subject` are left empty in the form, the backend derives reasonable fallbacks from the uploaded material and instructions.
