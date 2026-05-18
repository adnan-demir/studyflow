"""
Document endpoints.

POST /documents/process  — full pipeline (parse + chunk + embed)
POST /documents/parse    — parse only (text extraction, no embedding)
POST /embeddings/create  — embed pre-chunked content (attached to existing chunks)

The /documents/upload endpoint accepts a multipart file and triggers the full pipeline,
allowing the AI service to receive files directly (alternative to the Next.js disk path).
"""

import os
import uuid
import shutil
import tempfile
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from schemas.documents import (
    ProcessDocumentRequest,
    ProcessDocumentResponse,
    ParseDocumentRequest,
    ParseDocumentResponse,
    CreateEmbeddingsRequest,
    CreateEmbeddingsResponse,
    StatusResponse,
)
from services.document_service import process_document, parse_only, create_embeddings
from models.database import get_db, StudyMaterial
from sqlalchemy import text

router = APIRouter(prefix="/documents", tags=["Documents"])
logger = logging.getLogger(__name__)

# Allowed MIME types for direct upload
ALLOWED_MIME_TYPES = {"application/pdf", "text/plain", "text/markdown"}
MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB


# ── POST /documents/process ───────────────────────────────────────────────────

@router.post("/process", response_model=ProcessDocumentResponse)
def process_document_endpoint(
    request: ProcessDocumentRequest,
    db: Session = Depends(get_db),
) -> ProcessDocumentResponse:
    """
    Full pipeline: parse → chunk → embed → store embeddings.
    The file must be accessible at `filePath` on the server's filesystem.
    The StudyMaterial record must exist before calling this endpoint.
    """
    if not os.path.isfile(request.filePath):
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {request.filePath}",
        )
    try:
        return process_document(request, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Document processing failed for material %s", request.materialId)
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}")


# ── POST /documents/upload ────────────────────────────────────────────────────

@router.post("/upload", response_model=ProcessDocumentResponse)
async def upload_document_endpoint(
    materialId: str = Form(...),
    courseId: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ProcessDocumentResponse:
    """
    Accept a multipart file upload directly to the AI service, then run the
    full parse → chunk → embed pipeline.

    The StudyMaterial record must already exist in the database.
    This endpoint is an alternative to /documents/process for cases where
    the calling service does not share a filesystem with the AI service.
    """
    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {mime_type}. Allowed: {sorted(ALLOWED_MIME_TYPES)}",
        )

    # Stream to a temporary file (avoids loading the whole upload into memory)
    suffix = os.path.splitext(file.filename or "")[1] or ".bin"
    tmp_path = os.path.join(tempfile.gettempdir(), f"studyflow_{uuid.uuid4()}{suffix}")
    total_bytes = 0

    try:
        with open(tmp_path, "wb") as dst:
            while True:
                chunk = await file.read(1024 * 256)  # 256 KB chunks
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds the {MAX_UPLOAD_BYTES // (1024*1024)} MB limit.",
                    )
                dst.write(chunk)

        request = ProcessDocumentRequest(
            materialId=materialId,
            courseId=courseId,
            filePath=tmp_path,
            mimeType=mime_type,
        )

        try:
            return process_document(request, db)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except Exception as exc:
            logger.exception("Upload+process failed for material %s", materialId)
            raise HTTPException(status_code=500, detail=f"Processing failed: {exc}")

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# ── POST /documents/parse ─────────────────────────────────────────────────────

@router.post("/parse", response_model=ParseDocumentResponse)
def parse_document_endpoint(
    request: ParseDocumentRequest,
    db: Session = Depends(get_db),
) -> ParseDocumentResponse:
    """
    Parse only — extract text from a document and return pages.
    Does NOT chunk or embed. Useful for previewing extracted content.
    The file must be accessible at `filePath` on the server's filesystem.
    """
    if not os.path.isfile(request.filePath):
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {request.filePath}",
        )
    try:
        return parse_only(request, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Parse failed for material %s", request.materialId)
        raise HTTPException(status_code=500, detail=f"Parsing failed: {exc}")


# ── GET /documents/{materialId}/status ───────────────────────────────────────

@router.get("/{material_id}/status", response_model=StatusResponse)
def get_status_endpoint(
    material_id: str,
    db: Session = Depends(get_db),
) -> StatusResponse:
    """Return current processing status for a StudyMaterial."""
    row = db.execute(
        text(
            """
            SELECT status, "pageCount", "chunkCount", "processedAt", "processingError"
            FROM "StudyMaterial"
            WHERE id = :id
            """
        ),
        {"id": material_id},
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Material not found")

    return StatusResponse(
        materialId=material_id,
        status=row[0],
        pageCount=row[1],
        chunkCount=row[2],
        processedAt=row[3].isoformat() if row[3] else None,
        errorMessage=row[4],
    )
