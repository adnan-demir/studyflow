from pydantic import BaseModel
from typing import Literal


class TokenUsage(BaseModel):
    promptTokens: int
    completionTokens: int
    totalTokens: int


class HistoryMessage(BaseModel):
    role: Literal["USER", "ASSISTANT"]
    content: str


class ChatRequest(BaseModel):
    sessionId: str
    courseId: str
    message: str
    mode: Literal["NOTES_ONLY", "HYBRID"]
    history: list[HistoryMessage] = []


class SourceReference(BaseModel):
    documentId: str
    documentName: str
    pageNumber: int | None = None
    chunkPreview: str
    similarityScore: float | None = None
    retrievalRank: int | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceReference]
    mode: Literal["NOTES_ONLY", "HYBRID"]
    tokenUsage: TokenUsage | None = None
    promptVersion: str
