from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    full_name: str
    role: str
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
    password: str | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str

    class Config:
        from_attributes = True


class SystemStats(BaseModel):
    total_students: int
    total_faculty: int
    total_users: int
    at_risk_students: int
    total_assessments: int
    total_feedback: int


class RiskConfig(BaseModel):
    attendance_threshold: float
    engagement_threshold: float
    reflection_threshold: float