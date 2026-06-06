from __future__ import annotations

from pydantic import BaseModel


class DeletedResponse(BaseModel):
    deleted: bool
    id: int
