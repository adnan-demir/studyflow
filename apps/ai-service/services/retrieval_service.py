"""
Retrieval service — vector similarity search via pgvector.

Uses cosine distance (<=> operator) with a single parameterised query
for both filtered (by materialId) and unfiltered lookups.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from services.provider import get_provider
from schemas.retrieval import RetrievalResult
from config.settings import get_settings
from utils.logging_utils import timed_operation
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


def search_similar_chunks(
    db: Session,
    query: str,
    course_id: str,
    material_id: str | None = None,
    top_k: int | None = None,
    request_id: str | None = None,
) -> list[RetrievalResult]:
    """
    Embed query → cosine similarity search → return ranked RetrievalResult list.

    Args:
        db: SQLAlchemy session
        query: natural-language query string
        course_id: restrict search to this course's chunks
        material_id: optionally restrict to a single material
        top_k: number of results (defaults to settings.retrieval_top_k)
        request_id: for structured logging
    """
    top_k = top_k or settings.retrieval_top_k

    with timed_operation("embed_query", request_id=request_id) as ctx:
        provider = get_provider()
        query_embedding = provider.embed([query])[0]

    with timed_operation("vector_search", request_id=request_id) as ctx:
        rows = _run_search(db, query_embedding, course_id, material_id, top_k)

    return [
        RetrievalResult(
            chunkId=row[0],
            content=row[1],
            pageNumber=row[2],
            chunkIndex=row[3],
            materialId=row[4],
            documentName=row[5],
            similarityScore=float(row[6]),
            retrievalRank=rank,
        )
        for rank, row in enumerate(rows, start=1)
    ]


def _run_search(
    db: Session,
    embedding: list[float],
    course_id: str,
    material_id: str | None,
    top_k: int,
) -> list:
    """
    Execute the pgvector cosine-distance query.
    Adds optional materialId filter via a CASE expression to avoid SQL injection
    and keep a single prepared statement.
    """
    sql = text(
        """
        SELECT
            dc.id,
            dc."content",
            dc."pageNumber",
            dc."chunkIndex",
            dc."studyMaterialId",
            sm."originalFilename",
            1 - (dc.embedding <=> CAST(:embedding AS vector)) AS similarity_score
        FROM "DocumentChunk" dc
        JOIN "StudyMaterial" sm ON sm.id = dc."studyMaterialId"
        WHERE dc."courseId" = :course_id
          AND dc.embedding IS NOT NULL
          AND (:material_id IS NULL OR dc."studyMaterialId" = :material_id)
          AND sm.status = 'READY'
        ORDER BY dc.embedding <=> CAST(:embedding AS vector)
        LIMIT :top_k
        """
    )
    return db.execute(
        sql,
        {
            "embedding": str(embedding),
            "course_id": course_id,
            "material_id": material_id,
            "top_k": top_k,
        },
    ).fetchall()
