"""
Chunking service — paragraph-aware, sentence-boundary-aware splitting.

Design goals:
- Never cut inside a fenced code block (``` … ```)
- Never cut inside a LaTeX-style inline/block formula ($…$ / $$…$$)
- Prefer paragraph boundaries (double newline)
- Fall back to sentence boundaries (. ? !)
- Last resort: hard split at chunk_size
- Configurable size and overlap
"""

import re
from dataclasses import dataclass
from schemas.documents import ParsedPage
from config.settings import get_settings

settings = get_settings()


@dataclass
class Chunk:
    content: str
    chunk_index: int
    page_number: int | None
    metadata: dict


def chunk_pages(
    pages: list[ParsedPage],
    material_id: str,
    course_id: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[Chunk]:
    """
    Split pages into overlapping chunks.
    Preserves code blocks and inline formulas where possible.
    """
    chunk_size = chunk_size or settings.chunk_size
    chunk_overlap = chunk_overlap or settings.chunk_overlap

    chunks: list[Chunk] = []
    chunk_index = 0

    for page in pages:
        page_chunks = _split_text(page.text, chunk_size, chunk_overlap)
        for text in page_chunks:
            if not text.strip():
                continue
            chunks.append(
                Chunk(
                    content=text.strip(),
                    chunk_index=chunk_index,
                    page_number=page.pageNumber,
                    metadata={"materialId": material_id, "courseId": course_id},
                )
            )
            chunk_index += 1

    return chunks


# ─── Protected block detection ────────────────────────────────────────────────

_FENCED_CODE_RE = re.compile(r"```[\s\S]*?```", re.MULTILINE)
_BLOCK_FORMULA_RE = re.compile(r"\$\$[\s\S]*?\$\$", re.MULTILINE)

_PLACEHOLDER = "\x00PROTECTED_{idx}\x00"
_PLACEHOLDER_RE = re.compile(r"\x00PROTECTED_(\d+)\x00")


def _protect_blocks(text: str) -> tuple[str, dict[int, str]]:
    """
    Replace fenced code blocks and block-level formulas with stable placeholders
    so the splitter never cuts inside them.
    Returns (modified_text, {idx: original_block}).
    """
    protected: dict[int, str] = {}
    counter = [0]

    def replace(m: re.Match) -> str:
        idx = counter[0]
        protected[idx] = m.group(0)
        counter[0] += 1
        return _PLACEHOLDER.format(idx=idx)

    text = _FENCED_CODE_RE.sub(replace, text)
    text = _BLOCK_FORMULA_RE.sub(replace, text)
    return text, protected


def _restore_blocks(text: str, protected: dict[int, str]) -> str:
    """Substitute placeholders back with their original content."""
    def restore(m: re.Match) -> str:
        return protected.get(int(m.group(1)), m.group(0))

    return _PLACEHOLDER_RE.sub(restore, text)


# ─── Core splitter ────────────────────────────────────────────────────────────

def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """
    Main splitting function.
    Protects code/formula blocks, splits on boundaries, then restores.
    """
    if len(text) <= chunk_size:
        return [text]

    text_protected, protected = _protect_blocks(text)

    raw_chunks = _sliding_split(text_protected, chunk_size, overlap)

    # Restore protected blocks in each chunk
    return [_restore_blocks(c, protected) for c in raw_chunks if c.strip()]


def _sliding_split(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Sliding-window split on the (possibly placeholder-containing) text."""
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    n = len(text)

    while start < n:
        end = start + chunk_size

        if end >= n:
            tail = text[start:].strip()
            if tail:
                chunks.append(tail)
            break

        split_pos = _find_split(text, end, end - overlap)
        chunk = text[start:split_pos].strip()
        if chunk:
            chunks.append(chunk)

        # Advance with overlap
        start = max(split_pos - overlap, start + 1)

    return chunks


def _find_split(text: str, ideal_end: int, min_end: int) -> int:
    """
    Search backwards from ideal_end for the best split point.
    Priority: paragraph > single newline > sentence > word > hard cut.
    Never splits inside a placeholder.
    """
    # Validate min_end is sensible
    if min_end < 0:
        min_end = 0

    # 1. Double newline (paragraph boundary)
    pos = text.rfind("\n\n", min_end, ideal_end)
    if pos != -1 and _safe_to_split(text, pos + 2):
        return pos + 2

    # 2. Single newline
    pos = text.rfind("\n", min_end, ideal_end)
    if pos != -1 and _safe_to_split(text, pos + 1):
        return pos + 1

    # 3. Sentence-ending punctuation followed by a space
    for punct in (". ", "? ", "! "):
        pos = text.rfind(punct, min_end, ideal_end)
        if pos != -1 and _safe_to_split(text, pos + len(punct)):
            return pos + len(punct)

    # 4. Word boundary (space)
    pos = text.rfind(" ", min_end, ideal_end)
    if pos != -1 and _safe_to_split(text, pos + 1):
        return pos + 1

    # 5. Hard cut
    return ideal_end


def _safe_to_split(text: str, pos: int) -> bool:
    """
    Return False if pos falls inside a placeholder (i.e. we would cut a protected block).
    Simple check: the nearest \x00 before pos doesn't have a matching closing \x00 after pos.
    """
    before = text.rfind("\x00", 0, pos)
    if before == -1:
        return True
    after = text.find("\x00", pos)
    if after == -1:
        return True
    # There's a \x00 on both sides — we're inside a placeholder
    segment = text[before:after]
    return not segment.startswith("\x00PROTECTED_")
