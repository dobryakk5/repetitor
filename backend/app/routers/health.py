from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter()


class HealthResponse(BaseModel):
    ok: str


@router.get("/api/health/", response_model=HealthResponse)
def health() -> dict[str, str]:
    return {"ok": "true"}
