from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    allowed_origins: str = "http://localhost:3000"

    openai_api_key: str
    openai_base_url: str = "https://api.openai.com/v1"

    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    llm_model: str = "gpt-4o"

    chunk_size: int = 800
    chunk_overlap: int = 150
    retrieval_top_k: int = 6
    max_retrieval_chunks: int = 10
    max_context_tokens: int = 6000
    similarity_threshold: float = 0.30
    max_chat_message_length: int = 4000

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
