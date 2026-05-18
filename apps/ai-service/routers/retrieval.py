from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.retrieval import SearchRequest, SearchResponse
from services.retrieval_service import search_similar_chunks
from models.database import get_db
import logging

router = APIRouter(prefix="/retrieval", tags=["Retrieval"])
logger = logging.getLogger(__name__)


@router.post("/search", response_model=SearchResponse)
def search_endpoint(
    request: SearchRequest,
    db: Session = Depends(get_db),
) -> SearchResponse:
    """
    Perform vector similarity search across a course's document chunks.
    Optionally filter by materialId.
    """
    try:
        results = search_similar_chunks(
            db=db,
            query=request.query,
            course_id=request.courseId,
            material_id=request.materialId,
            top_k=request.topK,
        )
        return SearchResponse(results=results, query=request.query)
    except Exception as exc:
        logger.exception("Retrieval search failed")
        raise HTTPException(status_code=500, detail=str(exc))
