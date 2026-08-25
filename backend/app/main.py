from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.routes import router
from app.db.database import Base, SessionLocal, engine
from app.services.seed import seed_database

app = FastAPI(
    title="Student-Centered Analysis API",
    description="Analytics backend for academic focus and personal growth through formative assessment.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)


app.include_router(router, prefix="/api")
app.include_router(admin_router, prefix="/api/admin")


@app.get("/")
def root():
    return {
        "name": "Student-Centered Analysis System",
        "docs": "/docs",
        "health": "/api/health",
    }
