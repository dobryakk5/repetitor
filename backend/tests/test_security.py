from app.core.security import create_access_token, decode_access_token, hash_password, hash_refresh_token, verify_password


def test_password_hash_roundtrip():
    password_hash = hash_password("StrongPassword123")
    assert password_hash != "StrongPassword123"
    assert verify_password("StrongPassword123", password_hash)
    assert not verify_password("wrong", password_hash)


def test_access_token_roundtrip():
    token = create_access_token(123)
    payload = decode_access_token(token)
    assert payload["sub"] == "123"


def test_access_token_has_access_type():
    token = create_access_token(123)
    payload = decode_access_token(token)
    assert payload["typ"] == "access"


def test_refresh_token_hash_is_stable_and_not_raw():
    token = "refresh-token-example"
    token_hash = hash_refresh_token(token)
    assert token_hash == hash_refresh_token(token)
    assert token_hash != token
    assert len(token_hash) == 64
