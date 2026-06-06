def test_app_imports_and_routes_are_registered():
    from app.main import app

    assert app.title == "TutorTrack API"
    assert len(app.routes) > 0
