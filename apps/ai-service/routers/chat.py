import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from schemas.chat import ChatRequest, ChatResponse
from services.chat_service import answer_question
from models.database import get_db
from config.settings import get_settings

router = APIRouter(prefix="/chat", tags=["Chat"])
logger = logging.getLogger(__name__)
settings = get_settings()


@router.post("", response_model=ChatResponse)
def chat_endpoint(
    request: ChatRequest,
    db: Session = Depends(get_db),
    x_request_id: str | None = Header(default=None),
) -> ChatResponse:
    """
    RAG-based AI chat.

    NOTES_ONLY mode: answers strictly from uploaded course notes.
    HYBRID mode: combines notes with general knowledge, clearly labelled.

    Every response includes:
    - sources: only chunks actually used in the context (never invented)
    - tokenUsage: LLM token counts
    - promptVersion: semver of the prompt templates used
    """
    if len(request.message) > settings.max_chat_message_length:
        raise HTTPException(
            status_code=422,
            detail=f"Message exceeds the {settings.max_chat_message_length}-character limit.",
        )
    request_id = x_request_id or str(uuid.uuid4())[:8]
    try:
        return answer_question(request, db, request_id=request_id)
    except Exception as exc:
        logger.exception("[%s] Chat failed for session %s", request_id, request.sessionId)
        raise HTTPException(status_code=500, detail=str(exc))
