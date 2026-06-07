from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import analytics, auth, health, lessons, public, reports, school, students

app = FastAPI(title="TutorTrack API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3100", "http://127.0.0.1:3100"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(public.router)
app.include_router(students.router)
app.include_router(school.router)
app.include_router(lessons.router)
app.include_router(analytics.router)
app.include_router(reports.router)
