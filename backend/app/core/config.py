from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "student_centered_analysis.db"
JWT_SECRET = "student-centered-analysis-secret"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
