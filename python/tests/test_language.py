import pytest
from scanner.language import detect


def test_known_extensions():
    assert detect('file.py') == 'Python'
    assert detect('file.js') == 'JavaScript'
    assert detect('file.ts') == 'TypeScript'
    assert detect('file.go') == 'Go'
    assert detect('file.rs') == 'Rust'
    assert detect('file.rb') == 'Ruby'
    assert detect('file.java') == 'Java'
    assert detect('file.css') == 'CSS'
    assert detect('file.md') == 'Markdown'


def test_unknown_extension():
    assert detect('file.xyz') == 'unknown'
    assert detect('file.foobar') == 'unknown'
    assert detect('Makefile') == 'unknown'


def test_case_insensitive():
    assert detect('file.PY') == 'Python'
    assert detect('file.JS') == 'JavaScript'
    assert detect('file.TS') == 'TypeScript'


def test_dockerfile():
    assert detect('Dockerfile') == 'Dockerfile'
    assert detect('dockerfile') == 'Dockerfile'


def test_path_with_dirs():
    assert detect('/some/path/to/file.py') == 'Python'
    assert detect('src/components/App.tsx') == 'TSX'


def test_multiple_dots():
    # Only the last extension matters
    assert detect('file.test.py') == 'Python'
    assert detect('app.min.js') == 'JavaScript'
