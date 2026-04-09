import pytest
from scanner.quality import compute, _grade


def test_perfect_score():
    # comment ratio = 0.30, no smells, no security, small avg fn len, small files
    result = compute(
        total_loc=100, total_comment_lines=30, total_functions=10,
        total_function_lines=200, total_files=5,
        smell_warnings=0, smell_errors=0, secret_count=0, dangerous_call_count=0,
    )
    assert result['score'] == 100
    assert result['grade'] == 'A'


def test_grade_boundaries():
    assert _grade(100) == 'A'
    assert _grade(90) == 'A'
    assert _grade(89) == 'B'
    assert _grade(80) == 'B'
    assert _grade(79) == 'C'
    assert _grade(70) == 'C'
    assert _grade(69) == 'D'
    assert _grade(60) == 'D'
    assert _grade(59) == 'F'
    assert _grade(0) == 'F'


def test_score_decreases_with_smells():
    r_clean = compute(100, 20, 10, 200, 5, 0, 0, 0, 0)
    r_smelly = compute(100, 20, 10, 200, 5, 10, 5, 0, 0)
    assert r_clean['score'] > r_smelly['score']


def test_score_decreases_with_secrets():
    r_clean = compute(100, 20, 10, 200, 5, 0, 0, 0, 0)
    r_insecure = compute(100, 20, 10, 200, 5, 0, 0, 3, 0)
    assert r_clean['score'] > r_insecure['score']


def test_components_present():
    result = compute(100, 20, 10, 200, 5, 0, 0, 0, 0)
    assert 'code_smell_score' in result['components']
    assert 'security_score' in result['components']
    assert 'comment_score' in result['components']
    assert 'maintainability_score' in result['components']


def test_score_in_range():
    result = compute(100, 20, 10, 200, 5, 5, 2, 1, 3)
    assert 0 <= result['score'] <= 100


def test_zero_loc_no_crash():
    result = compute(0, 0, 0, 0, 0, 0, 0, 0, 0)
    assert 0 <= result['score'] <= 100
