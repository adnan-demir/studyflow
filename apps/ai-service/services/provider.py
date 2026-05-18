"""
Provider abstraction for LLM and embedding calls.

Decouples service logic from the OpenAI SDK so that:
- Alternative providers (Anthropic, Mistral, local Ollama) can be swapped in by
  changing only the factory, not the calling service.
- TODO (Phase 3): Add streamCompletion when streaming is needed.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from openai import OpenAI
from config.settings import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class TokenUsage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

    def as_dict(self) -> dict:
        return {
            "promptTokens": self.prompt_tokens,
            "completionTokens": self.completion_tokens,
            "totalTokens": self.total_tokens,
        }


@dataclass
class CompletionResult:
    content: str
    usage: TokenUsage


class EmbeddingProvider(ABC):
    """Interface for generating text embeddings."""

    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts. Returns vectors in the same order."""
        ...


class LLMProvider(ABC):
    """Interface for chat completions."""

    @abstractmethod
    def complete(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> CompletionResult:
        """Run a chat completion. Returns content + token usage."""
        ...

    # TODO (Phase 3): Add streamCompletion() -> AsyncIterator[str]


class OpenAIProvider(EmbeddingProvider, LLMProvider):
    """OpenAI implementation of both provider interfaces."""

    def __init__(self) -> None:
        self._client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        batch_size = 100
        all_embeddings: list[list[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = self._client.embeddings.create(
                input=batch,
                model=settings.embedding_model,
            )
            sorted_items = sorted(response.data, key=lambda x: x.index)
            all_embeddings.extend(item.embedding for item in sorted_items)

        return all_embeddings

    def complete(
        self,
        messages: list[dict],
        temperature: float = 0.2,
        max_tokens: int | None = None,
    ) -> CompletionResult:
        kwargs: dict = {"temperature": temperature}
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens

        response = self._client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            **kwargs,
        )

        content = response.choices[0].message.content or ""
        usage = response.usage

        return CompletionResult(
            content=content,
            usage=TokenUsage(
                prompt_tokens=usage.prompt_tokens if usage else 0,
                completion_tokens=usage.completion_tokens if usage else 0,
                total_tokens=usage.total_tokens if usage else 0,
            ),
        )


# ── Module-level singletons (lazy) ────────────────────────────────────────────

_provider: OpenAIProvider | None = None


def get_provider() -> OpenAIProvider:
    """Return the shared OpenAI provider instance."""
    global _provider
    if _provider is None:
        _provider = OpenAIProvider()
    return _provider
