import os
import tempfile
import pytest
from scanner.smells import detect

FIXTURES = os.path.join(os.path.dirname(__file__), 'fixtures')


def test_long_function_error_in_fixture():
    findings = detect(os.path.join(FIXTURES, 'sample.py'), 'Python')
    lf_errors = [f for f in findings if f['type'] == 'long_function' and f['severity'] == 'error']
    assert len(lf_errors) >= 1, f"Expected long_function error, got: {findings}"


def test_long_parameter_list_warning_in_fixture():
    findings = detect(os.path.join(FIXTURES, 'sample.py'), 'Python')
    lp = [f for f in findings if f['type'] == 'long_parameter_list']
    assert len(lp) >= 1, f"Expected long_parameter_list, got: {findings}"


def test_deep_nesting_in_js_fixture():
    findings = detect(os.path.join(FIXTURES, 'sample.js'), 'JavaScript')
    dn = [f for f in findings if f['type'] == 'deep_nesting']
    assert len(dn) >= 1, f"Expected deep_nesting, got: {findings}"


def test_findings_have_required_fields():
    findings = detect(os.path.join(FIXTURES, 'sample.py'), 'Python')
    assert len(findings) > 0, "Expected at least one finding"
    for f in findings:
        assert 'type' in f
        assert 'severity' in f
        assert 'file' in f
        assert 'line' in f
        assert 'function_name' in f
        assert 'detail' in f
        assert 'value' in f


def test_severity_values():
    findings = detect(os.path.join(FIXTURES, 'sample.py'), 'Python')
    for f in findings:
        assert f['severity'] in ('warning', 'error')


def test_no_smells_for_empty_file():
    with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as f:
        f.write('')
        path = f.name
    try:
        findings = detect(path, 'Python')
        assert findings == []
    finally:
        os.unlink(path)


def test_warning_threshold_long_function():
    # Function with exactly 35 lines body → warning (> 30)
    lines = ['def foo():\n'] + ['    x = 1\n'] * 35
    with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as f:
        f.writelines(lines)
        path = f.name
    try:
        findings = detect(path, 'Python')
        lf_warn = [x for x in findings if x['type'] == 'long_function' and x['severity'] == 'warning']
        assert len(lf_warn) >= 1
    finally:
        os.unlink(path)
