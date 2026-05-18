"""
RAG chat service.

Pipeline:
  1. Retrieve top-K chunks via vector search
  2. Filter by similarity threshold
  3. Trim context to stay within the token budget
  4. Build prompt (NOTES_ONLY or HYBRID)
  5. Call LLM via provider abstraction
  6. Return answer + sources (ONLY chunks that made it into the context)
"""

import tiktoken
from sqlalchemy.orm import Session
from schemas.chat import ChatRequest, ChatResponse, SourceReference, TokenUsage
from services.retrieval_service import search_similar_chunks
from services.provider import get_provider
from services.prompts import (
    NOTES_ONLY_SYSTEM,
    HYBRID_SYSTEM,
    PROMPT_VERSION,
    build_context_block,
)
from utils.text_utils import truncate_for_preview
from utils.logging_utils import timed_operation, log_token_usage
from config.settings import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

INSUFFICIENT_NOTES_RESPONSE = (
    "The uploaded notes do not contain enough information to answer this."
)

# tiktoken encoding used by gpt-4o and gpt-4-turbo — cached at module level
_ENCODING_NAME = "cl100k_base"
try:
    _ENCODER = tiktoken.get_encoding(_ENCODING_NAME)
except Exception:
    _ENCODER = None


def _count_tokens(text: str) -> int:
    if _ENCODER is not None:
        try:
            return len(_ENCODER.encode(text))
        except Exception:
            pass
    # Fallback: approximate 4 chars per token
    return len(text) // 4


def _trim_chunks_to_budget(
    chunks: list[dict],
    system_prompt_tokens: int,
    history_tokens: int,
    max_context_tokens: int,
) -> list[dict]:
    """
    Keep as many top-ranked chunks as fit within the token budget.
    Chunks are already sorted by relevance (highest first).
    Returns only the chunks that are actually used.
    """
    overhead = system_prompt_tokens + history_tokens + 200  # 200 = reply buffer
    budget = max_context_tokens - overhead
    if budget <= 0:
        return []

    included: list[dict] = []
    used = 0
    for chunk in chunks:
        tokens = _count_tokens(chunk["content"])
        if used + tokens > budget:
            break
        included.append(chunk)
        used += tokens

    return included


def answer_question(
    request: ChatRequest,
    db: Session,
    request_id: str | None = None,
) -> ChatResponse:
    """
    Retrieve chunks, build prompt within token budget, call LLM, return answer + sources.
    Only chunks that actually appear in the context block are returned as sources.
    """
    with timed_operation("retrieve_chunks", request_id=request_id):
        retrieved = search_similar_chunks(
            db=db,
            query=request.message,
            course_id=request.courseId,
            top_k=settings.retrieval_top_k,
            request_id=request_id,
        )

    # Filter by threshold, keep relevance order (already ranked)
    relevant = [r for r in retrieved if r.similarityScore >= settings.similarity_threshold]

    # Notes-only short-circuit when nothing is relevant
    if request.mode == "NOTES_ONLY" and not relevant:
        return ChatResponse(
            answer=INSUFFICIENT_NOTES_RESPONSE,
            sources=[],
            mode=request.mode,
            tokenUsage=None,
            promptVersion=PROMPT_VERSION,
        )

    # Build history messages (last 10 turns)
    history_messages = [
        {
            "role": "user" if msg.role == "USER" else "assistant",
            "content": msg.content,
        }
        for msg in request.history[-10:]
    ]
    history_tokens = sum(_count_tokens(m["content"]) for m in history_messages)

    # Assemble candidate chunks for context
    candidate_chunks = [
        {
            "content": r.content,
            "pageNumber": r.pageNumber,
            "documentName": r.documentName,
            "chunkId": r.chunkId,
            "materialId": r.materialId,
            "similarityScore": r.similarityScore,
            "retrievalRank": r.retrievalRank,
        }
        for r in relevant
    ]

    # Pick the system template to estimate its token size
    system_template = NOTES_ONLY_SYSTEM if request.mode == "NOTES_ONLY" else HYBRID_SYSTEM
    # Estimate system overhead without context yet
    system_overhead = _count_tokens(system_template.replace("{context}", ""))

    # Trim candidate chunks to fit the token budget
    used_chunks = _trim_chunks_to_budget(
        candidate_chunks,
        system_overhead,
        history_tokens,
        settings.max_context_tokens,
    )

    # If trimming removed everything and we're in NOTES_ONLY, return insufficient
    if not used_chunks and request.mode == "NOTES_ONLY":
        return ChatResponse(
            answer=INSUFFICIENT_NOTES_RESPONSE,
            sources=[],
            mode=request.mode,
            tokenUsage=None,
            promptVersion=PROMPT_VERSION,
        )

    context_block = build_context_block(used_chunks)
    system_prompt = system_template.format(context=context_block)

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    messages.extend(history_messages)
    messages.append({"role": "user", "content": request.message})

    with timed_operation("llm_complete", request_id=request_id) as ctx:
        provider = get_provider()
        result = provider.complete(messages, temperature=0.2)

    log_token_usage(
        request_id=request_id or "?",
        operation="chat",
        prompt_tokens=result.usage.prompt_tokens,
        completion_tokens=result.usage.completion_tokens,
        total_tokens=result.usage.total_tokens,
    )

    # ── Source transparency: only return sources for chunks used in context ──
    sources = [
        SourceReference(
            documentId=chunk["materialId"],
            documentName=chunk["documentName"],
            pageNumber=chunk["pageNumber"],
            chunkPreview=truncate_for_preview(chunk["content"]),
            similarityScore=chunk["similarityScore"],
            retrievalRank=chunk["retrievalRank"],
        )
        for chunk in used_chunks
    ]

    return ChatResponse(
        answer=result.content,
        sources=sources,
        mode=request.mode,
        tokenUsage=TokenUsage(
            promptTokens=result.usage.prompt_tokens,
            completionTokens=result.usage.completion_tokens,
            totalTokens=result.usage.total_tokens,
        ),
        promptVersion=PROMPT_VERSION,
    )
