from .constants import GRADE_BOUNDARIES


def compute(
    total_loc: int,
    total_comment_lines: int,
    total_functions: int,
    total_function_lines: int,
    total_files: int,
    smell_warnings: int,
    smell_errors: int,
    secret_count: int,
    dangerous_call_count: int,
) -> dict:
    code_smell_score = _code_smell_score(total_functions, smell_warnings, smell_errors)
    security_score   = _security_score(secret_count, dangerous_call_count)
    comment_score    = _comment_score(total_loc, total_comment_lines)
    maint_score      = _maintainability_score(total_functions, total_function_lines, total_files, total_loc)

    composite = round(
        code_smell_score * 0.30 +
        security_score   * 0.25 +
        comment_score    * 0.20 +
        maint_score      * 0.25
    )

    return {
        'score': composite,
        'grade': _grade(composite),
        'components': {
            'code_smell_score':      round(code_smell_score),
            'security_score':        round(security_score),
            'comment_score':         round(comment_score),
            'maintainability_score': round(maint_score),
        },
    }


def _code_smell_score(total_functions: int, warnings: int, errors: int) -> float:
    density = (warnings * 1 + errors * 2) / max(total_functions, 1)
    return max(0.0, 100.0 - density * 50.0)


def _security_score(secret_count: int, dangerous_call_count: int) -> float:
    return max(0.0, 100.0 - secret_count * 20.0 - dangerous_call_count * 10.0)


def _comment_score(total_loc: int, total_comment_lines: int) -> float:
    ratio = total_comment_lines / max(total_loc, 1)
    if ratio < 0.05:
        return ratio / 0.05 * 40.0
    if ratio <= 0.30:
        return 40.0 + (ratio - 0.05) / 0.25 * 60.0
    return max(60.0, 100.0 - (ratio - 0.30) * 200.0)


def _maintainability_score(
    total_functions: int,
    total_function_lines: int,
    total_files: int,
    total_loc: int,
) -> float:
    avg_fn_len = total_function_lines / max(total_functions, 1)
    if avg_fn_len <= 20:
        length_score = 100.0
    elif avg_fn_len <= 50:
        length_score = max(0.0, 100.0 - (avg_fn_len - 20) / 30.0 * 50.0)
    else:
        length_score = max(0.0, 50.0 - (avg_fn_len - 50) / 50.0 * 50.0)

    avg_file_loc = total_loc / max(total_files, 1)
    if avg_file_loc <= 200:
        file_score = 100.0
    elif avg_file_loc <= 500:
        file_score = max(0.0, 100.0 - (avg_file_loc - 200) / 300.0 * 40.0)
    else:
        file_score = max(0.0, 60.0 - (avg_file_loc - 500) / 500.0 * 60.0)

    return length_score * 0.6 + file_score * 0.4


def _grade(score: int) -> str:
    for threshold, letter in GRADE_BOUNDARIES:
        if score >= threshold:
            return letter
    return 'F'
