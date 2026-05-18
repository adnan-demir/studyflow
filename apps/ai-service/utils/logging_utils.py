"""
Structured logging helpers.

Each request gets a RequestContext with a unique requestId.
Duration and token usage are captured and emitted as structured log records.
"""

import logging
import time
import uuid
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Generator


logger = logging.getLogger(__name__)


@dataclass
class RequestContext:
    request_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    operation: str = ""
    _start: float = field(default_factory=time.monotonic, repr=False)

    def elapsed_ms(self) -> int:
        return int((time.monotonic() - self._start) * 1000)

    def log_start(self) -> None:
        logger.info(
            "[%s] START  op=%s",
            self.request_id,
            self.operation,
        )

    def log_end(self, extra: dict | None = None) -> None:
        parts = f"op={self.operation} duration_ms={self.elapsed_ms()}"
        if extra:
            parts += " " + " ".join(f"{k}={v}" for k, v in extra.items())
        logger.info("[%s] END    %s", self.request_id, parts)

    def log_error(self, error: Exception) -> None:
        logger.error(
            "[%s] ERROR  op=%s duration_ms=%d error=%s",
            self.request_id,
            self.operation,
            self.elapsed_ms(),
            str(error),
        )


@contextmanager
def timed_operation(
    operation: str,
    request_id: str | None = None,
    extra_end: dict | None = None,
) -> Generator[RequestContext, None, None]:
    """
    Context manager that logs start + end with duration.

    Usage:
        with timed_operation("embed_texts", request_id=rid) as ctx:
            ...
    """
    ctx = RequestContext(
        request_id=request_id or str(uuid.uuid4())[:8],
        operation=operation,
    )
    ctx.log_start()
    try:
        yield ctx
        ctx.log_end(extra=extra_end)
    except Exception as exc:
        ctx.log_error(exc)
        raise


def log_token_usage(
    request_id: str,
    operation: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
) -> None:
    logger.info(
        "[%s] TOKENS op=%s prompt=%d completion=%d total=%d",
        request_id,
        operation,
        prompt_tokens,
        completion_tokens,
        total_tokens,
    )


def log_processing_error(
    request_id: str,
    material_id: str,
    error: str,
) -> None:
    logger.error(
        "[%s] PROC_ERROR material_id=%s error=%s",
        request_id,
        material_id,
        error,
    )
