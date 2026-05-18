import re


def clean_text(text: str) -> str:
    """Remove excessive whitespace and control characters from extracted text."""
    # Replace form feeds, vertical tabs, null bytes
    text = re.sub(r"[\x00\x0c\x0b]", " ", text)
    # Collapse multiple blank lines into at most two
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse horizontal whitespace runs inside lines
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def truncate_for_preview(text: str, max_chars: int = 120) -> str:
    """Return a short preview of a chunk for source display."""
    text = text.replace("\n", " ").strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "…"
