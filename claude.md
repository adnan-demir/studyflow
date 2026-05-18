# CLAUDE.md

## Project
Project name: StudyFlow AI

Build a production-quality AI-powered study platform as a monorepo.

## Tech Stack
- Web app: Next.js 14+ App Router, TypeScript, Tailwind CSS
- UI Components: shadcn/ui
- Backend: Next.js server actions / API routes
- Database: PostgreSQL
- ORM: Prisma
- Vector search: pgvector
- AI/RAG service: Python FastAPI
- Monorepo structure:
  - apps/web
  - apps/ai-service
  - packages/shared if needed

## Engineering Rules
- Use clean architecture.
- Use TypeScript strict mode.
- Keep code modular and maintainable.
- Use feature-based folder structure.
- Use reusable UI components.
- Keep AI logic out of React components.
- Keep AI prompts centralized in services.
- Keep Python AI service separated from frontend logic.
- Use environment variables correctly.
- Add `.env.example` files.
- Do not hardcode secrets.
- Do not hardcode fake AI logic.
- Prioritize a working MVP over unnecessary complexity.
- Do not skip database models.
- Do not build this as a simple demo project.
- Write clean comments only where useful.
- Prefer scalable architecture decisions.
- Keep backend logic separated from presentation logic.

## Critical Rules
- Never pretend a feature works if it is not implemented.
- Mark incomplete features clearly with TODO.
- Prefer honest architecture over fake implementations.
- Do not generate placeholder fake implementations unless clearly marked TODO.
- Do not create fake AI responses that appear real.
- Do not simulate embeddings/vector search unless clearly marked as temporary TODO implementations.

## Product Rules
The app helps students:
- create courses
- upload notes
- chat with an AI tutor
- generate summaries
- generate quizzes
- track exam countdowns
- identify weak topics
- annotate PDFs
- use voice study mode
- simulate exams

## AI Mode Rules

### Notes Only Mode
- Use only uploaded course notes.
- If uploaded notes do not contain enough information:
  “The uploaded notes do not contain enough information to answer this.”

### Hybrid Mode
- Use uploaded notes plus general knowledge.
- Clearly separate:
  - From your uploaded notes
  - From general knowledge

## Source Transparency
Every AI answer must show sources when note-based content is used.
Never invent page numbers, document names, or fake sources.

## UX Rules
- Use a modern clean UI.
- Keep layouts responsive.
- Support dark mode.
- Add loading states.
- Add proper empty states.
- Add friendly error handling.

## Code Quality
- Use reusable components.
- Avoid duplicated logic.
- Keep services modular.
- Use strong typing.
- Validate inputs properly.
- Keep API contracts clean.

## Monorepo Structure
- apps/web
- apps/ai-service
- packages/shared

## Future Architecture
The Python FastAPI service will handle:
- PDF parsing
- chunking
- embeddings
- retrieval
- RAG
- quiz generation
- summary generation
- weak topic analysis

The Next.js app will handle:
- UI
- auth
- dashboard
- course management
- analytics
- API orchestration