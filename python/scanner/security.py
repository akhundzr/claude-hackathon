import re
import sys

_SECRET_PATTERNS = [
    ('aws_key',            r'(?i)(aws_access_key_id|aws_secret_access_key)\s*[=:]\s*[\'"]?[A-Za-z0-9/+=]{20,}'),
    ('api_key_assignment', r'(?i)(api[_-]?key|apikey|api[_-]?secret)\s*[=:]\s*[\'"]?[A-Za-z0-9_\-]{16,}'),
    ('password_assignment',r'(?i)(password|passwd|pwd)\s*[=:]\s*[\'"][^\'"]{4,}[\'"]'),
    ('private_key',        r'-----BEGIN (RSA|DSA|EC|OPENSSH)? ?PRIVATE KEY-----'),
    ('generic_token',      r'(?i)(token|secret|auth[_-]?key)\s*[=:]\s*[\'"]?[A-Za-z0-9_\-]{16,}'),
    ('connection_string',  r'(?i)(mongodb\+srv|postgres|mysql|redis):\/\/[^\s\'"]+'),
]

_DANGEROUS_PATTERNS = [
    ('eval_call',          r'\beval\s*\('),
    ('exec_call',          r'\bexec\s*\('),
    ('os_system',          r'\bos\.system\s*\('),
    ('subprocess_shell',   r'subprocess\.\w+\(.*shell\s*=\s*True'),
    ('innerHTML_assign',   r'\.innerHTML\s*='),
    ('dangerouslySetInnerHTML', r'dangerouslySetInnerHTML'),
    ('document_write',     r'\bdocument\.write\s*\('),
    ('child_process_exec', r'\bchild_process\.exec\s*\('),
    ('pickle_loads',       r'\bpickle\.loads\s*\('),
    ('yaml_unsafe_load',   r'\byaml\.load\s*\([^,)]*\)'),
    ('unsafe_c_string',    r'\b(strcpy|strcat|gets)\s*\('),
]


def scan(filepath: str, language: str) -> list[dict]:
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
    except OSError as exc:
        print(f"Warning: cannot read {filepath}: {exc}", file=sys.stderr)
        return []

    findings = []

    for lineno, raw in enumerate(lines, start=1):
        for pattern_name, pattern in _SECRET_PATTERNS:
            if re.search(pattern, raw):
                snippet = raw.strip()[:120]
                findings.append({
                    'type': 'hardcoded_secret',
                    'severity': 'error',
                    'file': filepath,
                    'line': lineno,
                    'pattern': pattern_name,
                    'detail': _secret_detail(pattern_name),
                    'snippet': snippet,
                })
                break  # one secret finding per line is enough

        for pattern_name, pattern in _DANGEROUS_PATTERNS:
            if re.search(pattern, raw):
                snippet = raw.strip()[:120]
                findings.append({
                    'type': 'dangerous_call',
                    'severity': 'warning',
                    'file': filepath,
                    'line': lineno,
                    'pattern': pattern_name,
                    'detail': _danger_detail(pattern_name),
                    'snippet': snippet,
                })
                break  # one danger finding per line

    return findings


def _secret_detail(name: str) -> str:
    details = {
        'aws_key':            'Possible hardcoded AWS key',
        'api_key_assignment': 'Possible hardcoded API key',
        'password_assignment':'Possible hardcoded password',
        'private_key':        'Private key header detected',
        'generic_token':      'Possible hardcoded token or secret',
        'connection_string':  'Possible hardcoded connection string with credentials',
    }
    return details.get(name, 'Possible hardcoded secret')


def _danger_detail(name: str) -> str:
    details = {
        'eval_call':           'eval() allows arbitrary code execution',
        'exec_call':           'exec() allows arbitrary code execution',
        'os_system':           'os.system() is vulnerable to shell injection',
        'subprocess_shell':    'subprocess with shell=True is vulnerable to shell injection',
        'innerHTML_assign':    '.innerHTML assignment is vulnerable to XSS',
        'dangerouslySetInnerHTML': 'dangerouslySetInnerHTML is vulnerable to XSS',
        'document_write':      'document.write() is vulnerable to XSS',
        'child_process_exec':  'child_process.exec() is vulnerable to shell injection',
        'pickle_loads':        'pickle.loads() is vulnerable to deserialization attacks',
        'yaml_unsafe_load':    'yaml.load() without Loader is unsafe',
        'unsafe_c_string':     'Unsafe C string function (buffer overflow risk)',
    }
    return details.get(name, 'Potentially dangerous function call')
