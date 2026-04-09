import re
import sys
from .constants import SMELL_THRESHOLDS
from .metrics import FUNCTION_PATTERNS


def detect(filepath: str, language: str) -> list[dict]:
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
    except OSError as exc:
        print(f"Warning: cannot read {filepath}: {exc}", file=sys.stderr)
        return []

    functions = _find_functions(lines, language)
    findings = []
    lf = SMELL_THRESHOLDS['long_function']
    dn = SMELL_THRESHOLDS['deep_nesting']
    lp = SMELL_THRESHOLDS['long_parameter_list']

    for fn in functions:
        name = fn['name']
        line = fn['start_line']
        body = fn['body_lines']
        depth = fn['max_depth']
        params = fn['param_count']

        if body > lf['error']:
            findings.append({
                'type': 'long_function', 'severity': 'error',
                'file': filepath, 'line': line, 'function_name': name,
                'detail': f'Function is {body} lines (threshold: {lf["error"]} for error)',
                'value': body,
            })
        elif body > lf['warning']:
            findings.append({
                'type': 'long_function', 'severity': 'warning',
                'file': filepath, 'line': line, 'function_name': name,
                'detail': f'Function is {body} lines (threshold: {lf["warning"]} for warning)',
                'value': body,
            })

        if depth > dn['error']:
            findings.append({
                'type': 'deep_nesting', 'severity': 'error',
                'file': filepath, 'line': line, 'function_name': name,
                'detail': f'Nesting depth is {depth} (threshold: {dn["error"]} for error)',
                'value': depth,
            })
        elif depth > dn['warning']:
            findings.append({
                'type': 'deep_nesting', 'severity': 'warning',
                'file': filepath, 'line': line, 'function_name': name,
                'detail': f'Nesting depth is {depth} (threshold: {dn["warning"]} for warning)',
                'value': depth,
            })

        if params > lp['error']:
            findings.append({
                'type': 'long_parameter_list', 'severity': 'error',
                'file': filepath, 'line': line, 'function_name': name,
                'detail': f'Function has {params} parameters (threshold: {lp["error"]} for error)',
                'value': params,
            })
        elif params > lp['warning']:
            findings.append({
                'type': 'long_parameter_list', 'severity': 'warning',
                'file': filepath, 'line': line, 'function_name': name,
                'detail': f'Function has {params} parameters (threshold: {lp["warning"]} for warning)',
                'value': params,
            })

    return findings


def total_function_lines(filepath: str, language: str) -> int:
    """Return sum of all function body lengths in the file."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
    except OSError:
        return 0
    return sum(fn['body_lines'] for fn in _find_functions(lines, language))


def _find_functions(lines: list[str], language: str) -> list[dict]:
    fn_pats = FUNCTION_PATTERNS.get(language, [])
    if not fn_pats:
        return []

    found = []
    n = len(lines)

    for i, line in enumerate(lines):
        matched = any(re.search(p, line) for p in fn_pats)
        if not matched:
            continue

        fn_indent = _indent(line)
        name = _extract_name(line)
        param_count = _count_params(line, lines, i, language)

        body_lines = 0
        max_depth = 0
        j = i + 1

        while j < n:
            bline = lines[j]
            bstripped = bline.rstrip()

            if not bstripped:
                body_lines += 1
                j += 1
                continue

            b_indent = _indent(bline)
            if b_indent <= fn_indent:
                break

            body_lines += 1
            depth = b_indent // 4
            if depth > max_depth:
                max_depth = depth
            j += 1

        found.append({
            'name': name,
            'start_line': i + 1,
            'body_lines': body_lines,
            'param_count': param_count,
            'max_depth': max_depth,
        })

    return found


def _indent(line: str) -> int:
    expanded = line.expandtabs(4)
    return len(expanded) - len(expanded.lstrip())


def _extract_name(line: str) -> str:
    for pattern in [
        r'\bdef\s+(\w+)\s*\(',      # Python/Ruby
        r'\bfunction\s+(\w+)\s*\(', # JS/TS named function
        r'\bfunc\s+\(?(\w+)',        # Go
        r'\bfn\s+(\w+)',             # Rust
        r'const\s+(\w+)\s*=',       # JS arrow/const
        r'fun\s+(\w+)\s*\(',        # Kotlin
    ]:
        m = re.search(pattern, line)
        if m:
            return m.group(1)
    return '<anonymous>'


def _count_params(line: str, lines: list[str], start: int, language: str) -> int:
    paren_pos = line.find('(')
    if paren_pos < 0:
        return 0

    param_str = ''
    depth = 0
    collecting = False

    for i in range(start, min(start + 10, len(lines))):
        text = lines[i][paren_pos:] if i == start else lines[i]
        for ch in text:
            if ch == '(':
                depth += 1
                collecting = True
            elif ch == ')':
                depth -= 1
                if depth == 0 and collecting:
                    return _parse_params(param_str, language)
            elif collecting and depth > 0:
                param_str += ch

    return 0


def _parse_params(param_str: str, language: str) -> int:
    param_str = param_str.strip()
    if not param_str:
        return 0

    # Split by comma, respecting nested brackets
    depth = 0
    params = []
    current = ''
    for ch in param_str:
        if ch in '([{<':
            depth += 1
            current += ch
        elif ch in ')]}>' :
            depth -= 1
            current += ch
        elif ch == ',' and depth == 0:
            p = current.strip()
            if p:
                params.append(p)
            current = ''
        else:
            current += ch
    p = current.strip()
    if p:
        params.append(p)

    if language == 'Python':
        filtered = []
        for p in params:
            base = p.split(':')[0].split('=')[0].strip().lstrip('*')
            if base not in ('self', 'cls'):
                filtered.append(p)
        return len(filtered)

    return len(params)
