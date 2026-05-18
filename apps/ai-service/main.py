"""
StudyFlow AI — Python FastAPI Service (Phase 2)

Handles: PDF parsing, chunking, embeddings, pgvector storage,
         RAG chat, summary generation.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import get_settings
from routers import (
    health_router,
    documents_router,
    embeddings_router,
    retrieval_router,
    chat_router,
    summaries_router,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)

settings = get_settings()

app = FastAPI(
    title="StudyFlow AI Service",
    description="AI/RAG backend for StudyFlow — parsing, embeddings, retrieval, chat, summaries.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(documents_router)
app.include_router(embeddings_router)
app.include_router(retrieval_router)
app.include_router(chat_router)
app.include_router(summaries_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
