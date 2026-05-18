from .health import router as health_router
from .documents import router as documents_router
from .embeddings import router as embeddings_router
from .retrieval import router as retrieval_router
from .chat import router as chat_router
from .summaries import router as summaries_router

__all__ = [
    "health_router",
    "documents_router",
    "embeddings_router",
    "retrieval_router",
    "chat_router",
    "summaries_router",
]
