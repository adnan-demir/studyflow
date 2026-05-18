import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from schemas.summaries import SummaryRequest, SummaryResponse
from services.summary_service import generate_summary
from models.database import get_db

router = APIRouter(prefix="/summaries", tags=["Summaries"])
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=SummaryResponse)
def generate_summary_endpoint(
    request: SummaryRequest,
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None),
) -> SummaryResponse:
    """
    Generate an AI summary of uploaded course materials.

    summaryType: SHORT | DETAILED | BULLET | EXAM_FOCUSED
    mode: NOTES_ONLY | HYBRID
    """
    request_id = x_request_id or str(uuid.uuid4())[:8]
    try:
        return generate_summary(request, db, request_id=request_id)
    except Exception as exc:
        logger.exception("[%s] Summary failed for course %s", request_id, request.courseId)
        raise HTTPException(status_code=500, detail=str(exc))
