from pydantic import BaseModel
from typing import Literal


# ── Shared status ─────────────────────────────────────────────────────────────

ProcessingStatus = Literal["PENDING", "PROCESSING", "READY", "FAILED"]


class StatusResponse(BaseModel):
    materialId: str
    status: ProcessingStatus
    pageCount: int | None = None
    chunkCount: int | None = None
    processedAt: str | None = None   # ISO-8601
    errorMessage: str | None = None


# ── Parse (extraction only) ───────────────────────────────────────────────────

class ParseDocumentRequest(BaseModel):
    materialId: str
    courseId: str
    filePath: str
    mimeType: str


class ParsedPage(BaseModel):
    pageNumber: int
    text: str


class ParseDocumentResponse(BaseModel):
    materialId: str
    pageCount: int
    pages: list[ParsedPage]


# ── Embeddings (for pre-chunked content) ─────────────────────────────────────

class ChunkInput(BaseModel):
    chunkId: str   # must match an existing DocumentChunk.id
    content: str


class CreateEmbeddingsRequest(BaseModel):
    materialId: str
    courseId: str
    chunks: list[ChunkInput]


class CreateEmbeddingsResponse(BaseModel):
    materialId: str
    embeddedCount: int


# ── Full pipeline (parse + chunk + embed) ────────────────────────────────────

class ProcessDocumentRequest(BaseModel):
    materialId: str
    courseId: str
    filePath: str
    mimeType: str


class ProcessDocumentResponse(BaseModel):
    materialId: str
    status: ProcessingStatus
    pageCount: int
    chunkCount: int
    processedAt: str   # ISO-8601
