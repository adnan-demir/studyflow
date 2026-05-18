# StudyFlow AI

An AI-powered study platform that helps students create courses, upload notes, chat with an AI tutor, generate summaries, and track exam countdowns.

## Architecture

```
studyflow-ai/                   ← Monorepo root (npm workspaces + Turborepo)
├── apps/
│   ├── web/                    ← Next.js 14 App Router (TypeScript, Tailwind, shadcn/ui)
│   │   ├── prisma/
│   │   │   └── schema.prisma   ← PostgreSQL + pgvector schema
│   │   └── src/
│   │       ├── app/            ← Next.js App Router pages
│   │       ├── actions/        ← Server Actions (auth, courses, materials, chat, summaries)
│   │       ├── components/     ← React components (UI, layout, notes, chat, summaries)
│   │       ├── services/       ← AI service HTTP client
│   │       ├── lib/            ← Auth, Prisma client, utilities
│   │       └── types/          ← TypeScript augmentations
│   └── ai-service/             ← Python FastAPI AI/RAG service
│       ├── config/             ← Settings (pydantic-settings)
│       ├── routers/            ← FastAPI route handlers
│       ├── services/           ← Business logic (parser, chunking, embedding, retrieval, chat, summary)
│       ├── models/             ← SQLAlchemy + pgvector models
│       ├── schemas/            ← Pydantic request/response schemas
│       └── utils/              ← Text utilities
└── packages/
    └── shared/                 ← Shared TypeScript types (web ↔ ai-service contracts)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript strict |
| Styling | Tailwind CSS 3, shadcn/ui, Radix UI |
| Auth | NextAuth.js v5 (Auth.js) — Credentials |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 5 (web), SQLAlchemy 2 (AI service) |
| Vector Search | pgvector (1536-dim OpenAI embeddings) |
| AI Service | Python FastAPI, OpenAI SDK |
| PDF Parsing | pypdf |
| Monorepo | npm workspaces + Turborepo |

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ with **pgvector** extension enabled
- Python 3.11+
- An OpenAI API key (or compatible provider)

## Local Development Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd studyflow-ai
npm install
```

### 2. Configure environment variables

```bash
# Web app
cp apps/web/.env.example apps/web/.env

# AI service
cp apps/ai-service/.env.example apps/ai-service/.env
```

**`apps/web/.env` required variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `AI_SERVICE_URL` | AI service URL (default: `http://localhost:8000`) |

**`apps/ai-service/.env` required variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Same PostgreSQL connection string | — |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `EMBEDDING_MODEL` | Embedding model name | `text-embedding-3-small` |
| `EMBEDDING_DIMENSIONS` | Embedding vector size | `1536` |
| `LLM_MODEL` | Chat completion model | `gpt-4o` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:3000` |
| `CHUNK_SIZE` | Max chars per text chunk | `800` |
| `CHUNK_OVERLAP` | Overlap between consecutive chunks | `150` |
| `RETRIEVAL_TOP_K` | Chunks returned by vector search | `6` |
| `MAX_RETRIEVAL_CHUNKS` | Hard cap on chunks before budget trimming | `10` |
| `MAX_CONTEXT_TOKENS` | Token budget for LLM context window | `6000` |

### 3. Apply the database schema

```bash
# From the project root:
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to the database (dev)
```

### 4. Set up pgvector

Supabase has pgvector pre-installed. Enable it in **Dashboard → Database → Extensions → vector**, then run the migration:

```sql
-- Run apps/ai-service/migrations/001_pgvector_setup.sql in your database:

CREATE EXTENSION IF NOT EXISTS vector;

-- HNSW index for fast cosine-similarity search (requires pgvector >= 0.5.0)
CREATE INDEX IF NOT EXISTS document_chunk_embedding_hnsw_idx
    ON "DocumentChunk"
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS document_chunk_course_id_idx
    ON "DocumentChunk" ("courseId");

CREATE INDEX IF NOT EXISTS document_chunk_material_id_idx
    ON "DocumentChunk" ("studyMaterialId");
```

> The migration file is at `apps/ai-service/migrations/001_pgvector_setup.sql`. Run it once after `prisma db push`.

### 5. Start the web app

```bash
npm run dev
# or: cd apps/web && npm run dev
```

Web app: **http://localhost:3000**

### 6. Start the AI service

```bash
cd apps/ai-service

python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

AI service: **http://localhost:8000** | Swagger docs: **http://localhost:8000/docs**

---

## Phase 2 — AI/RAG Architecture

### Document Processing Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | File saved to disk, AI processing not yet started |
| `PROCESSING` | AI service is actively parsing/chunking/embedding |
| `READY` | All chunks embedded and indexed; available for chat/summary |
| `FAILED` | Processing failed (see `processingError` field for reason) |

### Upload → Parse → Chunk → Embed → Retrieve → Chat

```
Browser
  │  multipart form submission
  ▼
Next.js Server Action (material-actions.ts)
  │  1. Validate: MIME type (PDF/txt/md), size ≤ 50 MB, non-empty
  │  2. Duplicate filename guard (same course, non-FAILED status)
  │  3. Write to disk → apps/web/uploads/{userId}/{courseId}/{uuid}.ext
  │  4. Create StudyMaterial record (status: PENDING)
  │  5. Fire-and-forget: POST /documents/process (non-blocking)
  ▼
FastAPI — document_service.process_document()
  │  1. SET status = PROCESSING
  │  2. parser_service.parse_document()
  │     → pypdf per-page text extraction (PDF)
  │     → plain-text/markdown read-through
  │  3. chunking_service.chunk_pages()
  │     → paragraph-aware, sentence-boundary splits
  │     → code/formula blocks protected (``` and $$ boundaries)
  │     → configurable size (default 800 chars) + overlap (150 chars)
  │  4. provider.embed(texts) → OpenAI text-embedding-3-small (batched ×100)
  │  5. INSERT DocumentChunk rows with pgvector embedding column (raw SQL)
  │  6. SET status = READY, processedAt = NOW()
  │     (on error: SET status = FAILED, processingError = <message>)
```

### Chat — RAG Flow

```
User sends message
  ▼
chat-actions.sendMessage()
  │  1. Persist USER message (role, content, mode)
  │  2. Load last 20 messages as history
  │  3. POST /chat
  ▼
FastAPI — chat_service.answer_question()
  │  1. embed query → pgvector cosine similarity (<=> operator)
  │     → filter by courseId + status=READY, return top-K with retrievalRank
  │  2. Filter: drop chunks with similarityScore < 0.30
  │  3. Token budget trimming (tiktoken cl100k_base):
  │     budget = MAX_CONTEXT_TOKENS − system_overhead − history_tokens − 200
  │     → include chunks greedily until budget exhausted
  │  4. Build prompt (only used_chunks in context)
  │     NOTES_ONLY: strict notes-only + insufficient-notes short-circuit
  │     HYBRID: two-section notes + general knowledge, clearly labelled
  │  5. OpenAI chat completion (gpt-4o, temp=0.2)
  │  6. Return answer + sources (ONLY chunks that made it into context)
  │     + tokenUsage + promptVersion
  ▼
chat-actions.sendMessage()
  │  Persist ASSISTANT message (content, mode, sources, tokenUsage, promptVersion)
  ▼
ChatInterface — SourceList shows per-message citations
```

### Summary Generation Flow

```
User selects type + mode + materials → clicks Generate
  ▼
summary-actions.createSummary()
  │  POST /summaries/generate
  ▼
FastAPI — summary_service.generate_summary()
  │  1. Load up to 150 chunks for selected materials (page + chunkIndex order)
  │     → only READY materials
  │  2. Build prompt from SUMMARY_SYSTEMS[summaryType]
  │     SHORT / DETAILED / BULLET / EXAM_FOCUSED
  │     NOTES_ONLY or HYBRID mode instruction appended
  │  3. OpenAI chat completion (temp 0.3)
  │  4. Return title + content + deduplicated SourceReference[]
  │     + tokenUsage + promptVersion
  ▼
summary-actions.createSummary()
  │  Persist Summary record (type, mode, content, sources, materialIds)
  ▼
SummaryCard with expandable content + SourceList
```

---

## API Endpoints (FastAPI)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/documents/process` | Full pipeline: parse + chunk + embed (file on disk) |
| `POST` | `/documents/upload` | Upload file to AI service + full pipeline |
| `POST` | `/documents/parse` | Parse only — returns extracted pages, no DB writes |
| `GET` | `/documents/{material_id}/status` | Check processing status + metadata |
| `POST` | `/embeddings/create` | Create embeddings for pre-existing chunks |
| `POST` | `/retrieval/search` | Vector similarity search |
| `POST` | `/chat` | RAG chat (NOTES_ONLY or HYBRID) |
| `POST` | `/summaries/generate` | Generate AI summary |

---

## Database Models

| Model | Phase | Description |
|-------|-------|-------------|
| `User` | 1 | Auth user |
| `Account` / `Session` | 1 | NextAuth tables |
| `Course` | 1 | Study course |
| `Exam` | 1 | Exam date per course |
| `StudyMaterial` | 2 | Uploaded file metadata + processing status |
| `DocumentChunk` | 2 | Text chunks with pgvector embedding |
| `ChatSession` | 2 | Conversation thread per course |
| `ChatMessage` | 2 | Message + source JSON |
| `Summary` | 2 | AI-generated summary (type, mode, sources) |
| `Quiz` / `QuizQuestion` / `QuizAttempt` | 1 schema | Phase 3 implementation |
| `WeakTopic` | 1 schema | Phase 3 implementation |
| `Annotation` | 1 schema | Phase 4 implementation |
| `StudyActivity` | 1 schema | Phase 4 implementation |

---

## Completed Features

### Phase 1
- [x] Monorepo (npm workspaces + Turborepo)
- [x] Next.js 14 App Router, TypeScript strict, Tailwind, shadcn/ui
- [x] NextAuth credentials auth (sign up / sign in / sign out)
- [x] Protected routes via middleware
- [x] Dark mode
- [x] Course CRUD + exam date management
- [x] Exam countdown widget
- [x] Course overview dashboard with live DB stats
- [x] Left sidebar with course navigation

### Phase 2
- [x] Prisma schema with pgvector (`Unsupported("vector(1536)")`)
- [x] StudyMaterial upload with validation (MIME type, 50 MB cap, empty file, duplicate guard)
- [x] Fire-and-forget AI processing (non-blocking upload response)
- [x] FastAPI full structure (config, routers, services, schemas, models, utils)
- [x] PDF parsing service (`pypdf`, per-page)
- [x] Smart chunking (paragraph-aware, sentence-boundary, code/formula block protection)
- [x] Embeddings pipeline (OpenAI `text-embedding-3-small`, batched ×100)
- [x] pgvector storage via raw SQL (cosine similarity `<=>`)
- [x] HNSW index migration (`apps/ai-service/migrations/001_pgvector_setup.sql`)
- [x] Retrieval service (top-K, retrievalRank, similarityScore, filter by courseId/materialId)
- [x] Token budget context management (tiktoken, greedily trims chunks to `MAX_CONTEXT_TOKENS`)
- [x] Provider abstraction (`EmbeddingProvider` / `LLMProvider` ABCs, `OpenAIProvider` impl)
- [x] Structured logging (`RequestContext`, `timed_operation`, `log_token_usage`)
- [x] AI chat — NOTES_ONLY mode (strict notes-only, insufficient-notes short-circuit)
- [x] AI chat — HYBRID mode (notes + general knowledge, clearly separated)
- [x] Source transparency (only chunks used in context returned; never invented)
- [x] Prompt versioning (`PROMPT_VERSION = "1.1.0"` in `prompts.py`)
- [x] Chat message persistence (role, content, mode, sources, tokenUsage, promptVersion)
- [x] `StudyMaterial.processedAt` — timestamps READY/FAILED transitions
- [x] Processing statuses: PENDING → PROCESSING → READY / FAILED
- [x] Summary generation (SHORT / DETAILED / BULLET / EXAM_FOCUSED × NOTES_ONLY / HYBRID)
- [x] Summary persistence with sources
- [x] `/documents/upload`, `/documents/parse`, `/embeddings/create` endpoints
- [x] Study Materials upload page (drag-and-drop, progress, status badges)
- [x] AI Chat page (session sidebar, mode selector, message bubbles, source cards)
- [x] Summaries page (generator, type/mode selectors, expandable cards)

---

## Known Limitations

| Area | Limitation |
|------|-----------|
| File storage | Files are stored on local disk (`apps/web/uploads/`). For production, migrate to object storage (Supabase Storage / S3). |
| AI processing | Processing is fire-and-forget with no retry mechanism. If the AI service is unreachable, the material stays `PENDING`. |
| Async workers | No background job queue yet (no Redis/Celery). The AI service processes documents synchronously within the HTTP request. The architecture is prepared for async workers to be added later. |
| Streaming | LLM responses are returned in full (no streaming). `streamCompletion()` is a `TODO` placeholder in the provider abstraction. |
| File types | Only PDF, plain text (`.txt`), and Markdown (`.md`) are supported. |
| Auth | Credentials-only (email + password). OAuth providers (GitHub, Google) are wired but disabled — add client IDs to enable. |

---

## Remaining Work — Phase 3

- [ ] Quiz generation from uploaded notes (FastAPI `POST /quizzes/generate`)
- [ ] Quiz UI (question display, answer selection, scoring)
- [ ] Quiz attempt persistence + score history
- [ ] Weak topic analysis from quiz results
- [ ] Weak Topics UI

---

## Folder Structure (apps/web/src)

```
src/
├── app/
│   ├── (auth)/              ← Sign in / sign up
│   └── (dashboard)/
│       ├── dashboard/       ← Dashboard overview
│       └── courses/
│           └── [courseId]/
│               ├── page.tsx           ← Course overview
│               ├── edit/              ← Edit course
│               ├── notes/             ← Study materials upload ✅ Phase 2
│               ├── chat/              ← AI Chat ✅ Phase 2
│               ├── summaries/         ← Summaries ✅ Phase 2
│               ├── quizzes/           ← TODO Phase 3
│               ├── weak-topics/       ← TODO Phase 3
│               ├── voice/             ← TODO Phase 4
│               └── exam-simulation/   ← TODO Phase 4
├── actions/
│   ├── auth-actions.ts
│   ├── course-actions.ts
│   ├── material-actions.ts  ← Phase 2
│   ├── chat-actions.ts      ← Phase 2
│   └── summary-actions.ts   ← Phase 2
├── services/
│   └── ai-service-client.ts ← Phase 2
└── components/
    ├── ui/                  ← shadcn/ui + Progress
    ├── layout/              ← Sidebar, TopNav
    ├── notes/               ← UploadZone, MaterialList ← Phase 2
    ├── chat/                ← ChatInterface, ChatMessage, SourceCard, ChatModeSelector ← Phase 2
    ├── summaries/           ← SummaryGenerator, SummaryCard, SummaryTypeSelector ← Phase 2
    ├── courses/
    ├── dashboard/
    └── shared/
```
