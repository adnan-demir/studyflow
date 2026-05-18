from pydantic import BaseModel
from typing import Literal
from schemas.chat import SourceReference


class SummaryRequest(BaseModel):
    courseId: str
    materialIds: list[str]
    summaryType: Literal["SHORT", "DETAILED", "BULLET", "EXAM_FOCUSED"] = "SHORT"
    mode: Literal["NOTES_ONLY", "HYBRID"] = "HYBRID"


class SummaryResponse(BaseModel):
    title: str
    content: str
    sources: list[SourceReference]
