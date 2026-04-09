import os
import tempfile
import pytest
from scanner.security import scan

FIXTURES = os.path.join(os.path.dirname(__file__), 'fixtures')


def test_hardcoded_api_key_in_fixture():
    findings = scan(os.path.join(FIXTURES, 'sample.py'), 'Python')
    secrets = [f for f in findings if f['type'] == 'hardcoded_secret']
    assert len(secrets) >= 1, f"Expected hardcoded_secret, got: {findings}"


def test_eval_in_js_fixture():
    findings = scan(os.path.join(FIXTURES, 'sample.js'), 'JavaScript')
    evals = [f for f in findings if f['pattern'] == 'eval_call']
    assert len(evals) >= 1, f"Expected eval_call, got: {findings}"


def test_secret_severity_is_error():
    findings = scan(os.path.join(FIXTURES, 'sample.py'), 'Python')
    secrets = [f for f in findings if f['type'] == 'hardcoded_secret']
    assert all(f['severity'] == 'error' for f in secrets)


def test_dangerous_call_severity_is_warning():
    findings = scan(os.path.join(FIXTURES, 'sample.js'), 'JavaScript')
    dangerous = [f for f in findings if f['type'] == 'dangerous_call']
    assert all(f['severity'] == 'warning' for f in dangerous)


def test_findings_have_required_fields():
    findings = scan(os.path.join(FIXTURES, 'sample.py'), 'Python')
    assert len(findings) > 0
    for f in findings:
        assert 'type' in f
        assert 'severity' in f
        assert 'file' in f
        assert 'line' in f
        assert 'pattern' in f
        assert 'detail' in f
        assert 'snippet' in f


def test_aws_key_pattern():
    content = 'aws_access_key_id = "AKIAIOSFODNN7EXAMPLE123"\n'
    with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as f:
        f.write(content)
        path = f.name
    try:
        findings = scan(path, 'Python')
        aws = [x for x in findings if x['pattern'] == 'aws_key']
        assert len(aws) >= 1
    finally:
        os.unlink(path)


def test_password_pattern():
    content = 'password = "mysecretpassword"\n'
    with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as f:
        f.write(content)
        path = f.name
    try:
        findings = scan(path, 'Python')
        pw = [x for x in findings if x['pattern'] == 'password_assignment']
        assert len(pw) >= 1
    finally:
        os.unlink(path)


def test_os_system_pattern():
    content = 'import os\nos.system("ls")\n'
    with tempfile.NamedTemporaryFile(suffix='.py', mode='w', delete=False) as f:
        f.write(content)
        path = f.name
    try:
        findings = scan(path, 'Python')
        sys_calls = [x for x in findings if x['pattern'] == 'os_system']
        assert len(sys_calls) >= 1
    finally:
        os.unlink(path)
