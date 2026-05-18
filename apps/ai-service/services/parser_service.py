from pypdf import PdfReader
from schemas.documents import ParsedPage
from utils.text_utils import clean_text
import logging

logger = logging.getLogger(__name__)


def parse_pdf(file_path: str) -> list[ParsedPage]:
    """Extract text from a PDF, returning one ParsedPage per PDF page."""
    reader = PdfReader(file_path)
    pages: list[ParsedPage] = []

    for i, page in enumerate(reader.pages, start=1):
        raw = page.extract_text() or ""
        text = clean_text(raw)
        if text:
            pages.append(ParsedPage(pageNumber=i, text=text))

    return pages


def parse_text_file(file_path: str) -> list[ParsedPage]:
    """Read a plain-text file and treat it as a single page."""
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        raw = f.read()
    text = clean_text(raw)
    return [ParsedPage(pageNumber=1, text=text)] if text else []


def parse_document(file_path: str, mime_type: str) -> list[ParsedPage]:
    """Dispatch to the correct parser based on MIME type."""
    if mime_type == "application/pdf":
        return parse_pdf(file_path)
    elif mime_type in ("text/plain", "text/markdown"):
        return parse_text_file(file_path)
    else:
        raise ValueError(f"Unsupported MIME type for parsing: {mime_type}")
