import re
import sys

_C_STYLE_LANGS = frozenset({
    'JavaScript', 'TypeScript', 'JSX', 'TSX', 'Java', 'C', 'C++',
    'C/C++ Header', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP',
    'CSS', 'SCSS/Sass',
})
_HASH_COMMENT_LANGS = frozenset({'Python', 'Ruby', 'Shell', 'R'})
_HTML_LANGS = frozenset({'HTML', 'XML'})
_SQL_LANGS = frozenset({'SQL'})

FUNCTION_PATTERNS: dict[str, list[str]] = {
    'Python':     [r'^\s*def\s+\w+\s*\('],
    'Ruby':       [r'^\s*def\s+\w+'],
    'Shell':      [r'^\s*\w+\s*\(\)\s*\{?\s*$'],
    'Go':         [r'^\s*func\s+'],
    'Rust':       [r'^\s*fn\s+\w+\s*[(<]'],
    'JavaScript': [r'^\s*function\s+\w+\s*\(',
                   r'^\s*const\s+\w+\s*=\s*(function\b|\([^)]*\)\s*=>|\w+\s*=>)',
                   r'^\s*async\s+function\s+\w+\s*\('],
    'TypeScript': [r'^\s*function\s+\w+\s*\(',
                   r'^\s*const\s+\w+\s*=\s*(function\b|\([^)]*\)\s*=>|\w+\s*=>)',
                   r'^\s*async\s+function\s+\w+\s*\('],
    'JSX':        [r'^\s*function\s+\w+\s*\(',
                   r'^\s*const\s+\w+\s*=\s*(function\b|\([^)]*\)\s*=>|\w+\s*=>)'],
    'TSX':        [r'^\s*function\s+\w+\s*\(',
                   r'^\s*const\s+\w+\s*=\s*(function\b|\([^)]*\)\s*=>|\w+\s*=>)'],
    'Java':       [r'(public|private|protected)\s.*\w+\s*\('],
    'C#':         [r'(public|private|protected)\s.*\w+\s*\('],
    'Kotlin':     [r'^\s*(fun|override\s+fun)\s+\w+\s*\('],
    'PHP':        [r'^\s*(public|private|protected|static)?\s*function\s+\w+\s*\('],
    'Swift':      [r'^\s*func\s+\w+\s*\('],
    'Scala':      [r'^\s*def\s+\w+'],
}

CLASS_PATTERNS: dict[str, list[str]] = {
    'Python':     [r'^\s*class\s+\w+'],
    'JavaScript': [r'^\s*class\s+\w+'],
    'TypeScript': [r'^\s*class\s+\w+'],
    'JSX':        [r'^\s*class\s+\w+'],
    'TSX':        [r'^\s*class\s+\w+'],
    'Ruby':       [r'^\s*class\s+\w+'],
    'PHP':        [r'^\s*class\s+\w+'],
    'C++':        [r'^\s*class\s+\w+'],
    'Java':       [r'^\s*(public\s+|private\s+|protected\s+)?(abstract\s+|final\s+)?class\s+\w+'],
    'C#':         [r'^\s*(public\s+|private\s+|protected\s+)?(abstract\s+|sealed\s+)?class\s+\w+'],
    'Kotlin':     [r'^\s*(data\s+|sealed\s+|abstract\s+|open\s+)?class\s+\w+'],
    'Go':         [r'^\s*type\s+\w+\s+struct\s*\{'],
    'Rust':       [r'^\s*struct\s+\w+'],
    'Swift':      [r'^\s*class\s+\w+'],
}


def analyze_file(filepath: str, language: str) -> dict | None:
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
    except OSError as exc:
        print(f"Warning: cannot read {filepath}: {exc}", file=sys.stderr)
        return None

    counts = _count_lines(lines, language)
    return {
        'path': filepath,
        'language': language,
        'loc': counts['loc'],
        'comment_lines': counts['comment_lines'],
        'blank_lines': counts['blank_lines'],
        'functions': counts['functions'],
        'classes': counts['classes'],
    }


def _count_lines(lines: list[str], language: str) -> dict:
    loc = 0
    comment_lines = 0
    blank_lines = 0
    functions = 0
    classes = 0
    in_block = False
    block_end: str | None = None

    fn_pats = FUNCTION_PATTERNS.get(language, [])
    cls_pats = CLASS_PATTERNS.get(language, [])

    for raw in lines:
        stripped = raw.strip()

        if not stripped:
            blank_lines += 1
            continue

        # Inside a block comment
        if in_block:
            comment_lines += 1
            if block_end and block_end in stripped:
                in_block = False
            continue

        handled = False

        # Python triple-quote block comments / docstrings
        if language == 'Python':
            for bc in ('"""', "'''"):
                idx = stripped.find(bc)
                if idx >= 0:
                    before = stripped[:idx].strip()
                    after = stripped[idx + 3:]
                    same_line_close = bc in after
                    if not before:
                        comment_lines += 1
                    else:
                        loc += 1
                        _check_defs(raw, fn_pats, cls_pats,
                                    lambda: None,
                                    lambda: None)
                    if not same_line_close:
                        in_block = True
                        block_end = bc
                    handled = True
                    break

            if not handled:
                if stripped.startswith('#'):
                    comment_lines += 1
                    handled = True

        # C-style /* ... */ and // comments
        elif language in _C_STYLE_LANGS:
            blk = stripped.find('/*')
            if blk >= 0:
                before = stripped[:blk].strip()
                after = stripped[blk + 2:]
                same_line_close = '*/' in after
                if not before:
                    comment_lines += 1
                else:
                    loc += 1
                if not same_line_close:
                    in_block = True
                    block_end = '*/'
                handled = True
            elif stripped.startswith('//'):
                comment_lines += 1
                handled = True

        # HTML / XML <!-- ... -->
        elif language in _HTML_LANGS:
            blk = stripped.find('<!--')
            if blk >= 0:
                before = stripped[:blk].strip()
                after = stripped[blk + 4:]
                same_line_close = '-->' in after
                if not before:
                    comment_lines += 1
                else:
                    loc += 1
                if not same_line_close:
                    in_block = True
                    block_end = '-->'
                handled = True

        # Shell / Ruby / R hash comments
        elif language in _HASH_COMMENT_LANGS:
            if stripped.startswith('#'):
                comment_lines += 1
                handled = True

        # SQL
        elif language in _SQL_LANGS:
            if stripped.startswith('--'):
                comment_lines += 1
                handled = True
            else:
                blk = stripped.find('/*')
                if blk >= 0:
                    before = stripped[:blk].strip()
                    after = stripped[blk + 2:]
                    same_line_close = '*/' in after
                    if not before:
                        comment_lines += 1
                    else:
                        loc += 1
                    if not same_line_close:
                        in_block = True
                        block_end = '*/'
                    handled = True

        if not handled:
            loc += 1
            for pat in fn_pats:
                if re.search(pat, raw):
                    functions += 1
                    break
            for pat in cls_pats:
                if re.search(pat, raw):
                    classes += 1
                    break

    return {
        'loc': loc,
        'comment_lines': comment_lines,
        'blank_lines': blank_lines,
        'functions': functions,
        'classes': classes,
    }


def _check_defs(raw, fn_pats, cls_pats, fn_cb, cls_cb):
    for pat in fn_pats:
        if re.search(pat, raw):
            fn_cb()
            break
    for pat in cls_pats:
        if re.search(pat, raw):
            cls_cb()
            break
