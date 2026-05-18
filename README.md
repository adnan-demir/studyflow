# StudyFlow AI

An AI-powered study platform that helps students create courses, upload notes, chat with an AI tutor, generate quizzes, and track exam countdowns.

## Architecture

```
studyflow-ai/                   ← Monorepo root (npm workspaces + Turborepo)
├── apps/
│   ├── web/                    ← Next.js 15 web app (TypeScript, Tailwind, shadcn/ui)
│   │   ├── prisma/
│   │   │   └── schema.prisma   ← PostgreSQL database schema
│   │   └── src/
│   │       ├── app/            ← Next.js App Router pages
│   │       ├── actions/        ← Next.js Server Actions
│   │       ├── components/     ← React components (UI, layout, features)
│   │       ├── lib/            ← Utilities (auth, prisma client, helpers)
│   │       └── types/          ← TypeScript type augmentations
│   └── ai-service/             ← Python FastAPI AI/RAG service (Phase 2+)
└── packages/
    └── shared/                 ← Shared TypeScript types (web ↔ ai-service)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript (strict) |
| Styling | Tailwind CSS 3, shadcn/ui, Radix UI |
| Auth | NextAuth.js v5 (Auth.js) with Credentials |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| AI Service | Python FastAPI (skeleton, Phase 2+) |
| Vector Search | pgvector (Phase 2+) |
| Monorepo | npm workspaces + Turborepo |

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ running locally (or connection string to a hosted instance)
- Python 3.11+ (for the AI service)

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd studyflow-ai
npm install
```

### 2. Configure environment variables

```bash
# Web app
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your values

# AI service (optional for Phase 1)
cp apps/ai-service/.env.example apps/ai-service/.env
```

**Required variables in `apps/web/.env`:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT signing. Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `AI_SERVICE_URL` | AI service URL (default: `http://localhost:8000`) |

### 3. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate
```

### 4. Run the development server

```bash
# Run all apps
npm run dev

# Or run web app only
cd apps/web && npm run dev
```

The web app is available at **http://localhost:3000**

### 5. Run the AI service (optional for Phase 1)

```bash
cd apps/ai-service
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

AI service available at **http://localhost:8000** | API docs at **http://localhost:8000/docs**

## Database

### Schema overview

| Model | Description |
|-------|-------------|
| `User` | Auth user account |
| `Account` / `Session` | NextAuth OAuth/session tables |
| `Course` | A student's study course |
| `Exam` | Exam date attached to a course (1:1) |
| `StudyMaterial` | Uploaded PDF/document |
| `DocumentChunk` | Text chunks from parsed documents |
| `Summary` | AI-generated course summary |
| `Quiz` | A set of quiz questions |
| `QuizQuestion` | Individual question with options |
| `QuizAttempt` | User's completed quiz attempt |
| `WeakTopic` | AI-identified topic the user struggles with |
| `Annotation` | Highlighted/annotated passage in a document |
| `ChatSession` | A conversation thread per course |
| `ChatMessage` | Individual message in a chat session |
| `StudyActivity` | Activity log for streaks and analytics |

### Migration commands

```bash
# Apply all pending migrations (development)
npm run db:migrate

# Apply pending migrations (production/CI)
npm run db:migrate:deploy

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Monorepo Scripts

Run from the project root:

```bash
npm run dev              # Start all apps in development
npm run build            # Build all apps
npm run type-check       # TypeScript check across all packages
npm run lint             # Lint all packages
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to DB (no migration files)
npm run db:migrate       # Create and run migrations
npm run db:migrate:deploy# Run pending migrations (production)
npm run db:studio        # Open Prisma Studio
```

## Phase 1 — Completed Features

- [x] Monorepo structure (npm workspaces + Turborepo)
- [x] Next.js 15 App Router with TypeScript strict mode
- [x] Tailwind CSS + shadcn/ui component library
- [x] PostgreSQL database with full Prisma schema
- [x] NextAuth.js v5 credentials-based authentication
- [x] Sign up / Sign in / Sign out flows
- [x] Protected dashboard routes (middleware)
- [x] Dark mode support
- [x] Left sidebar with course tree (accordion nav)
- [x] Course CRUD (create, read, update, delete)
- [x] Exam date management (set/update per course)
- [x] Dynamic exam countdown ("X days until exam", "Today!", "passed X days ago")
- [x] Course overview dashboard with real DB stats
- [x] Polished placeholder pages for all future features
- [x] Python FastAPI skeleton with all future endpoints documented
- [x] Shared TypeScript types package
- [x] `.env.example` files for all apps
- [x] Comprehensive README

## Future Phases

### Phase 2 — Notes & AI Chat
- PDF upload (file storage)
- PDF parsing and text extraction (FastAPI)
- Document chunking and pgvector embeddings
- AI Chat (Notes Only + Hybrid modes with source attribution)

### Phase 3 — Quizzes & Summaries
- AI quiz generation from notes
- Quiz attempt tracking and scoring
- AI summary generation
- Weak topic analysis from quiz results

### Phase 4 — Advanced Features
- Voice study mode (speech-to-text + TTS)
- Exam simulation (timed, full test)
- Study streak tracking
- Readiness percentage calculation
- PDF annotations
- Analytics dashboard

## Folder Structure (apps/web)

```
src/
├── app/
│   ├── (auth)/              ← Sign in / sign up pages
│   ├── (dashboard)/         ← All protected pages
│   │   ├── dashboard/       ← Main dashboard
│   │   └── courses/
│   │       ├── new/         ← Create course
│   │       └── [courseId]/
│   │           ├── page.tsx         ← Course overview
│   │           ├── edit/            ← Edit course
│   │           ├── chat/            ← AI Chat (TODO Phase 2)
│   │           ├── summaries/       ← Summaries (TODO Phase 3)
│   │           ├── quizzes/         ← Quizzes (TODO Phase 3)
│   │           ├── notes/           ← PDF Notes (TODO Phase 2)
│   │           ├── weak-topics/     ← Weak Topics (TODO Phase 3)
│   │           ├── voice/           ← Voice Mode (TODO Phase 4)
│   │           └── exam-simulation/ ← Exam Simulation (TODO Phase 4)
│   └── api/auth/            ← NextAuth route handler
├── actions/                 ← Server Actions (auth, courses)
├── components/
│   ├── ui/                  ← shadcn/ui components
│   ├── layout/              ← Sidebar, TopNav
│   ├── courses/             ← CourseCard, CourseForm, DeleteButton
│   ├── dashboard/           ← StatCard, ExamCountdown
│   ├── shared/              ← PlaceholderPage, EmptyState
│   └── providers/           ← ThemeProvider
├── lib/
│   ├── auth.ts              ← NextAuth config
│   ├── prisma.ts            ← Prisma client singleton
│   └── utils.ts             ← Helpers (cn, getExamCountdown, etc.)
└── types/
    └── next-auth.d.ts       ← Session type augmentation
```
