from pydantic import BaseModel
from typing import List


class StudentImport(BaseModel):
    roll_no: str
    full_name: str
    semester: int
    department: str
    attendance_rate: float = 0.0
    engagement_score: float = 0.0
    self_reflection_score: float = 0.0


class BulkImportResponse(BaseModel):
    success_count: int
    failed_count: int
    errors: List[str]