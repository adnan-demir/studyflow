"""
Document processing service.

Full pipeline:  parse → chunk → embed → persist
Each stage is isolated so callers can run partial pipelines
(see /documents/parse and /embeddings/create endpoints).
"""

import uuid
import json
import logging
from datetime import datetime, UTC
from sqlalchemy.orm import Session
from sqlalchemy import text
from pypdf.errors import PdfReadError

from services.parser_service import parse_document
from services.chunking_service import chunk_pages, Chunk
from services.provider import get_provider
from schemas.documents import (
    ProcessDocumentRequest,
    ProcessDocumentResponse,
    ParseDocumentRequest,
    ParseDocumentResponse,
    CreateEmbeddingsRequest,
    CreateEmbeddingsResponse,
)
from utils.logging_utils import timed_operation, log_processing_error

logger = logging.getLogger(__name__)


# ─── Full pipeline ────────────────────────────────────────────────────────────

def process_document(
    request: ProcessDocumentRequest,
    db: Session,
    request_id: str | None = None,
) -> ProcessDocumentResponse:
    """
    Parse + chunk + embed + persist a document.
    Updates StudyMaterial status throughout; always leaves it in READY or FAILED.
    """
    _set_status(db, request.materialId, "PROCESSING")

    try:
        with timed_operation("parse_document", request_id=request_id):
            pages = parse_document(request.filePath, request.mimeType)

        if not pages:
            raise ValueError("Document produced no extractable text after parsing.")

        with timed_operation("chunk_pages", request_id=request_id):
            chunks = chunk_pages(pages, request.materialId, request.courseId)

        if not chunks:
            raise ValueError("Chunking produced zero chunks.")

        with timed_operation("embed_and_persist", request_id=request_id):
            _embed_and_persist(db, chunks, request.materialId, request.courseId)

        processed_at = datetime.now(UTC)
        _mark_ready(db, request.materialId, len(pages), len(chunks), processed_at)

        return ProcessDocumentResponse(
            materialId=request.materialId,
            status="READY",
            pageCount=len(pages),
            chunkCount=len(chunks),
            processedAt=processed_at.isoformat(),
        )

    except PdfReadError as exc:
        err = f"Corrupted or password-protected PDF: {exc}"
        logger.warning("[%s] %s material_id=%s", request_id or "?", err, request.materialId)
        db.rollback()
        _mark_failed(db, request.materialId, err)
        raise ValueError(err) from exc

    except Exception as exc:
        log_processing_error(request_id or "?", request.materialId, str(exc))
        db.rollback()
        _mark_failed(db, request.materialId, str(exc))
        raise


# ─── Parse-only ───────────────────────────────────────────────────────────────

def parse_only(
    request: ParseDocumentRequest,
    db: Session,
    request_id: str | None = None,
) -> ParseDocumentResponse:
    """Extract text only — no chunking or embedding."""
    try:
        with timed_operation("parse_document", request_id=request_id):
            pages = parse_document(request.filePath, request.mimeType)
        return ParseDocumentResponse(
            materialId=request.materialId,
            pageCount=len(pages),
            pages=pages,
        )
    except PdfReadError as exc:
        raise ValueError(f"Corrupted or password-protected PDF: {exc}") from exc


# ─── Embedding-only ───────────────────────────────────────────────────────────

def create_embeddings(
    request: CreateEmbeddingsRequest,
    db: Session,
    request_id: str | None = None,
) -> CreateEmbeddingsResponse:
    """
    Generate and store embeddings for pre-chunked content.
    The DocumentChunk rows must already exist; this just fills in the embedding column.
    """
    if not request.chunks:
        return CreateEmbeddingsResponse(materialId=request.materialId, embeddedCount=0)

    with timed_operation("embed_chunks", request_id=request_id):
        provider = get_provider()
        texts = [c.content for c in request.chunks]
        embeddings = provider.embed(texts)

    for chunk_input, embedding in zip(request.chunks, embeddings):
        db.execute(
            text(
                """
                UPDATE "DocumentChunk"
                SET embedding = CAST(:embedding AS vector)
                WHERE id = :chunk_id
                  AND "studyMaterialId" = :material_id
                """
            ),
            {
                "embedding": str(embedding),
                "chunk_id": chunk_input.chunkId,
                "material_id": request.materialId,
            },
        )

    db.commit()
    return CreateEmbeddingsResponse(
        materialId=request.materialId,
        embeddedCount=len(request.chunks),
    )


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _embed_and_persist(
    db: Session,
    chunks: list[Chunk],
    material_id: str,
    course_id: str,
) -> None:
    """Embed all chunks and INSERT them into DocumentChunk in a single transaction."""
    provider = get_provider()
    texts = [c.content for c in chunks]
    embeddings = provider.embed(texts)

    for chunk, embedding in zip(chunks, embeddings):
        chunk_id = str(uuid.uuid4())
        db.execute(
            text(
                """
                INSERT INTO "DocumentChunk"
                    (id, "courseId", "studyMaterialId", content, "chunkIndex",
                     "pageNumber", metadata, embedding, "createdAt")
                VALUES
                    (:id, :course_id, :material_id, :content, :chunk_index,
                     :page_number, CAST(:metadata AS jsonb), CAST(:embedding AS vector), NOW())
                """
            ),
            {
                "id": chunk_id,
                "course_id": course_id,
                "material_id": material_id,
                "content": chunk.content,
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "metadata": json.dumps(chunk.metadata or {}),
                "embedding": str(embedding),
            },
        )

    db.commit()


def _set_status(db: Session, material_id: str, status: str) -> None:
    db.execute(
        text(
            'UPDATE "StudyMaterial" SET status = :status, "updatedAt" = NOW() WHERE id = :id'
        ),
        {"status": status, "id": material_id},
    )
    db.commit()


def _mark_ready(
    db: Session,
    material_id: str,
    page_count: int,
    chunk_count: int,
    processed_at: datetime,
) -> None:
    db.execute(
        text(
            """
            UPDATE "StudyMaterial"
            SET status       = 'READY',
                "pageCount"  = :page_count,
                "chunkCount" = :chunk_count,
                "processedAt" = :processed_at,
                "processingError" = NULL,
                "updatedAt"  = NOW()
            WHERE id = :id
            """
        ),
        {
            "page_count": page_count,
            "chunk_count": chunk_count,
            "processed_at": processed_at,
            "id": material_id,
        },
    )
    db.commit()


def _mark_failed(db: Session, material_id: str, error: str) -> None:
    db.execute(
        text(
            """
            UPDATE "StudyMaterial"
            SET status = 'FAILED',
                "processingError" = :error,
                "processedAt" = NOW(),
                "updatedAt"   = NOW()
            WHERE id = :id
            """
        ),
        {"error": error[:2000], "id": material_id},  # cap error length
    )
    db.commit()
