import pytest
from scanner.aggregator import aggregate


def fr(path, lang, loc=100, comments=15, blanks=20, fns=5, classes=1, smells=0, sec=0):
    return {'path': path, 'language': lang, 'loc': loc, 'comment_lines': comments,
            'blank_lines': blanks, 'functions': fns, 'classes': classes,
            'smells': smells, 'security_issues': sec}


def test_basic_totals():
    files = [fr('/d/a.py', 'Python', loc=100), fr('/d/b.py', 'Python', loc=200),
             fr('/d/c.js', 'JavaScript', loc=50)]
    r = aggregate('/d', files, [], [], 0, 100)
    assert r['summary']['total_loc'] == 350
    assert r['summary']['total_files'] == 3


def test_per_language_breakdown():
    files = [fr('/d/a.py', 'Python', loc=100, fns=3, classes=1),
             fr('/d/b.py', 'Python', loc=200, fns=5, classes=2),
             fr('/d/c.js', 'JavaScript', loc=50, fns=2)]
    r = aggregate('/d', files, [], [], 0, 50)
    py = r['summary']['languages']['Python']
    assert py['files'] == 2
    assert py['loc'] == 300
    assert py['functions'] == 8
    assert py['classes'] == 3
    assert 'JavaScript' in r['summary']['languages']


def test_schema_keys_present():
    r = aggregate('/d', [], [], [], 0, 10)
    for key in ('scan_metadata', 'summary', 'quality', 'code_smells', 'security', 'files'):
        assert key in r


def test_smell_counts():
    smells = [
        {'severity': 'warning', 'file': '/d/a.py', 'type': 'long_function',
         'line': 1, 'function_name': 'foo', 'detail': '', 'value': 35},
        {'severity': 'error', 'file': '/d/b.py', 'type': 'deep_nesting',
         'line': 5, 'function_name': 'bar', 'detail': '', 'value': 7},
    ]
    r = aggregate('/d', [], smells, [], 0, 10)
    assert r['code_smells']['total_warnings'] == 1
    assert r['code_smells']['total_errors'] == 1


def test_security_counts():
    sec = [
        {'type': 'hardcoded_secret', 'severity': 'error', 'file': '/d/a.py',
         'line': 3, 'pattern': 'api_key', 'detail': '', 'snippet': ''},
    ]
    r = aggregate('/d', [], [], sec, 0, 10)
    assert r['security']['total_findings'] == 1


def test_file_paths_are_relative():
    files = [fr('/mydir/src/app.py', 'Python')]
    r = aggregate('/mydir', files, [], [], 0, 10)
    assert r['files'][0]['path'] == 'src/app.py'


def test_scan_metadata():
    r = aggregate('/d', [], [], [], 2, 123)
    assert r['scan_metadata']['skipped_files'] == 2
    assert r['scan_metadata']['scan_duration_ms'] == 123
    assert r['scan_metadata']['directory'] == '/d'
    assert 'timestamp' in r['scan_metadata']
