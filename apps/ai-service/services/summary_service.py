"""
Summary generation service.

Loads all (or selected) chunks for a course, builds the prompt,
calls the LLM, and returns a structured SummaryResponse with sources.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from schemas.summaries import SummaryRequest, SummaryResponse
from schemas.chat import SourceReference
from services.provider import get_provider
from services.prompts import (
    SUMMARY_SYSTEMS,
    NOTES_ONLY_MODE_INSTRUCTION,
    HYBRID_MODE_INSTRUCTION,
    build_context_block,
)
from utils.text_utils import truncate_for_preview
from utils.logging_utils import timed_operation, log_token_usage
from config.settings import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# Max chunks to send for summarisation (prevents exceeding LLM context window)
_MAX_SUMMARY_CHUNKS = 150


def generate_summary(
    request: SummaryRequest,
    db: Session,
    request_id: str | None = None,
) -> SummaryResponse:
    """
    Load chunks for the requested materials, build the summary prompt, call the LLM.
    """
    with timed_operation("load_chunks_for_summary", request_id=request_id):
        chunks = _load_chunks_for_materials(db, request.courseId, request.materialIds)

    if not chunks:
        return SummaryResponse(
            title="Summary",
            content="The uploaded notes do not contain enough information to generate a summary.",
            sources=[],
        )

    context_block = build_context_block(chunks)

    mode_instruction = (
        NOTES_ONLY_MODE_INSTRUCTION
        if request.mode == "NOTES_ONLY"
        else HYBRID_MODE_INSTRUCTION
    )
    system_template = SUMMARY_SYSTEMS.get(request.summaryType, SUMMARY_SYSTEMS["SHORT"])
    system_prompt = system_template.format(mode_instruction=mode_instruction)

    user_prompt = (
        f"Generate a {request.summaryType.lower().replace('_', '-')} summary "
        f"of the following course material:\n\n{context_block}"
    )

    with timed_operation("llm_summarise", request_id=request_id):
        provider = get_provider()
        result = provider.complete(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )

    log_token_usage(
        request_id=request_id or "?",
        operation="summary",
        prompt_tokens=result.usage.prompt_tokens,
        completion_tokens=result.usage.completion_tokens,
        total_tokens=result.usage.total_tokens,
    )

    # Derive a title
    first_doc = chunks[0].get("documentName", "Notes") if chunks else "Notes"
    type_label = {
        "SHORT": "Short Summary",
        "DETAILED": "Detailed Summary",
        "BULLET": "Bullet Summary",
        "EXAM_FOCUSED": "Exam-Focused Summary",
    }.get(request.summaryType, "Summary")
    title = f"{type_label} — {first_doc}"

    # Deduplicate sources by materialId (in order of first appearance)
    seen: set[str] = set()
    sources: list[SourceReference] = []
    for chunk in chunks:
        mid = chunk.get("materialId", "")
        if mid not in seen:
            seen.add(mid)
            sources.append(
                SourceReference(
                    documentId=mid,
                    documentName=chunk.get("documentName", ""),
                    pageNumber=chunk.get("pageNumber"),
                    chunkPreview=truncate_for_preview(chunk.get("content", "")),
                )
            )

    return SummaryResponse(title=title, content=result.content, sources=sources)


def _load_chunks_for_materials(
    db: Session,
    course_id: str,
    material_ids: list[str],
) -> list[dict]:
    """
    Load chunks ordered by document → page → chunkIndex.
    Uses READY materials only. Capped at _MAX_SUMMARY_CHUNKS.
    """
    if not material_ids:
        sql = text(
            """
            SELECT dc."content", dc."pageNumber", dc."chunkIndex",
                   dc."studyMaterialId", sm."originalFilename"
            FROM "DocumentChunk" dc
            JOIN "StudyMaterial" sm ON sm.id = dc."studyMaterialId"
            WHERE dc."courseId" = :course_id
              AND sm.status = 'READY'
            ORDER BY sm."originalFilename", dc."pageNumber" NULLS LAST, dc."chunkIndex"
            LIMIT :limit
            """
        )
        rows = db.execute(
            sql, {"course_id": course_id, "limit": _MAX_SUMMARY_CHUNKS}
        ).fetchall()
    else:
        sql = text(
            """
            SELECT dc."content", dc."pageNumber", dc."chunkIndex",
                   dc."studyMaterialId", sm."originalFilename"
            FROM "DocumentChunk" dc
            JOIN "StudyMaterial" sm ON sm.id = dc."studyMaterialId"
            WHERE dc."courseId" = :course_id
              AND dc."studyMaterialId" = ANY(:material_ids)
              AND sm.status = 'READY'
            ORDER BY sm."originalFilename", dc."pageNumber" NULLS LAST, dc."chunkIndex"
            LIMIT :limit
            """
        )
        rows = db.execute(
            sql,
            {
                "course_id": course_id,
                "material_ids": material_ids,
                "limit": _MAX_SUMMARY_CHUNKS,
            },
        ).fetchall()

    return [
        {
            "content": row[0],
            "pageNumber": row[1],
            "chunkIndex": row[2],
            "materialId": row[3],
            "documentName": row[4],
        }
        for row in rows
    ]
