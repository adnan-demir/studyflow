from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    courseId: str
    materialId: str | None = None
    topK: int = 6


class RetrievalResult(BaseModel):
    chunkId: str
    content: str
    pageNumber: int | None
    chunkIndex: int
    materialId: str
    documentName: str
    similarityScore: float
    retrievalRank: int   # 1-based rank in the result set


class SearchResponse(BaseModel):
    results: list[RetrievalResult]
    query: str
