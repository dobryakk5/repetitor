import pytest
from fastapi import HTTPException

from app.services.tutor import calculate_accuracy, calculate_progress_score, define_mastery_status, define_risk_level


def test_calculate_accuracy_from_tasks():
    assert calculate_accuracy(8, 6, None) == 75


def test_calculate_accuracy_manual_when_no_tasks():
    assert calculate_accuracy(None, None, 66) == 66


def test_calculate_accuracy_rejects_correct_greater_than_total():
    with pytest.raises(HTTPException):
        calculate_accuracy(5, 6, None)


def test_progress_score_formula():
    assert calculate_progress_score(70, 80, 60, 75) == 71


def test_mastery_limited_by_low_independence():
    assert define_mastery_status(90, 35) == "needs_practice"


def test_risk_level_high_for_low_progress():
    assert define_risk_level(45, 80, 80, False) == "high"
