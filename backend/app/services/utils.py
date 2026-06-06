from datetime import date, datetime, time, timezone


def now() -> datetime:
    return datetime.now(timezone.utc)


def parse_date_value(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value[:10])


def parse_datetime_value(value: str | None) -> datetime:
    if not value:
        return now()
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        parsed_date = date.fromisoformat(value[:10])
        return datetime.combine(parsed_date, time.min, tzinfo=timezone.utc)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def initials(name: str) -> str:
    parts = [part for part in name.split() if part]
    return "".join(part[:1].upper() for part in parts[:2]) or "-"
