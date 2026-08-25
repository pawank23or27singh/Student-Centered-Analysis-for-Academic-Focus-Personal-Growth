from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[1]
VENDOR_DIR = ROOT_DIR / ".vendor"

if str(VENDOR_DIR) not in sys.path:
    sys.path.insert(0, str(VENDOR_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.db.database import Base, SessionLocal, engine
from app.services.analytics import AnalyticsService
from app.services.seed import seed_database


def run_smoke_test() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
        service = AnalyticsService(db)
        students = service.list_students()
        assert students, "Seeded students should exist"
        analytics = service.get_student_analytics(students[0]["id"])
        assert analytics["predicted_risk"] in {"Low Risk", "Medium Risk", "High Risk"}
        overview = service.faculty_overview()
        assert overview["total_students"] >= 1
    print("analytics smoke test passed")


if __name__ == "__main__":
    run_smoke_test()
