"""
StudyFlow AI - Python FastAPI Service (Phase 1 Skeleton)

This service will handle:
- PDF parsing and text extraction
- Document chunking
- Embeddings generation and storage
- RAG-based AI chat
- Quiz generation
- Summary generation
- Weak topic analysis

TODO: All AI/RAG functionality will be implemented in Phase 2+.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="StudyFlow AI Service",
    description="AI/RAG backend for StudyFlow",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    version: str
    phase: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version="0.1.0",
        phase="Phase 1 - Skeleton only. AI features not yet implemented.",
    )


# ---------------------------------------------------------------------------
# TODO (Phase 2): PDF Parsing endpoint
# POST /documents/parse
# Accepts: multipart file upload (PDF)
# Returns: extracted text, page count
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# TODO (Phase 2): Chunking endpoint
# POST /documents/chunk
# Accepts: raw text, studyMaterialId, courseId
# Returns: list of chunks with metadata
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# TODO (Phase 2): Embeddings endpoint
# POST /embeddings/generate
# Accepts: list of text chunks
# Returns: list of vector embeddings
# Stores: chunks + embeddings into pgvector
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# TODO (Phase 2): AI Chat endpoint
# POST /chat
# Accepts: message, courseId, sessionId, mode (NOTES_ONLY | HYBRID), history
# Returns: AI answer with sources
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# TODO (Phase 3): Summary generation endpoint
# POST /summaries/generate
# Accepts: courseId, studyMaterialIds
# Returns: structured summary
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# TODO (Phase 3): Quiz generation endpoint
# POST /quizzes/generate
# Accepts: courseId, topic, questionCount
# Returns: quiz questions with options and answers
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# TODO (Phase 3): Weak topic analysis endpoint
# POST /analysis/weak-topics
# Accepts: courseId, userId, quizAttempts
# Returns: list of weak topics with confidence scores
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
