from __future__ import annotations

from fastapi import Query
from typing import Annotated

LimitQuery = Annotated[int, Query(ge=1, le=500)]
OffsetQuery = Annotated[int, Query(ge=0)]


def apply_pagination(query, limit: int, offset: int):
    return query.limit(limit).offset(offset)
