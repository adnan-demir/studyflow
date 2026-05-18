"""
Embeddings endpoint — create embeddings for pre-chunked content.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.documents import CreateEmbeddingsRequest, CreateEmbeddingsResponse
from services.document_service import create_embeddings
from models.database import get_db

router = APIRouter(prefix="/embeddings", tags=["Embeddings"])
logger = logging.getLogger(__name__)


@router.post("/create", response_model=CreateEmbeddingsResponse)
def create_embeddings_endpoint(
    request: CreateEmbeddingsRequest,
    db: Session = Depends(get_db),
) -> CreateEmbeddingsResponse:
    """
    Generate and store embeddings for pre-chunked content.

    The DocumentChunk rows must already exist in the database.
    This fills in the `embedding` vector column on each chunk.
    Useful when you want to chunk content externally and only delegate embedding.
    """
    if not request.chunks:
        raise HTTPException(status_code=422, detail="chunks list must not be empty")
    try:
        return create_embeddings(request, db)
    except Exception as exc:
        logger.exception("Embedding creation failed for material %s", request.materialId)
        raise HTTPException(status_code=500, detail=f"Embedding failed: {exc}")
