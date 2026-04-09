import os
import tempfile
import pytest
from scanner.metrics import analyze_file


def make_file(content, suffix='.py'):
    f = tempfile.NamedTemporaryFile(mode='w', suffix=suffix, delete=False,
                                    encoding='utf-8')
    f.write(content)
    f.close()
    return f.name


def test_python_counts():
    path = make_file('# comment\ndef foo():\n    pass\n\nx = 1\n')
    try:
        r = analyze_file(path, 'Python')
        assert r['comment_lines'] == 1
        assert r['loc'] == 3     # def foo():, pass, x = 1
        assert r['blank_lines'] == 1
        assert r['functions'] == 1
        assert r['classes'] == 0
    finally:
        os.unlink(path)


def test_blank_lines():
    path = make_file('\n\nx = 1\n\n')
    try:
        r = analyze_file(path, 'Python')
        assert r['blank_lines'] == 3
        assert r['loc'] == 1
    finally:
        os.unlink(path)


def test_js_comment_lines():
    path = make_file('// comment\nfunction foo() {\n    return 1;\n}\n', '.js')
    try:
        r = analyze_file(path, 'JavaScript')
        assert r['comment_lines'] == 1
        assert r['functions'] >= 1
    finally:
        os.unlink(path)


def test_inline_comment_counts_as_loc():
    path = make_file('x = 1  # inline comment\n')
    try:
        r = analyze_file(path, 'Python')
        assert r['loc'] == 1
        assert r['comment_lines'] == 0
    finally:
        os.unlink(path)


def test_class_count():
    path = make_file('class Foo:\n    pass\n\nclass Bar:\n    pass\n')
    try:
        r = analyze_file(path, 'Python')
        assert r['classes'] == 2
    finally:
        os.unlink(path)


def test_python_block_comment():
    path = make_file('def foo():\n    """\n    docstring\n    """\n    pass\n')
    try:
        r = analyze_file(path, 'Python')
        # The """ lines count as comment_lines, not loc
        assert r['functions'] == 1
        assert r['comment_lines'] >= 1
    finally:
        os.unlink(path)


def test_js_block_comment():
    content = '/* block\n   comment */\nconst x = 1;\n'
    path = make_file(content, '.js')
    try:
        r = analyze_file(path, 'JavaScript')
        assert r['comment_lines'] >= 1
        assert r['loc'] >= 1
    finally:
        os.unlink(path)


def test_unreadable_returns_none():
    r = analyze_file('/nonexistent/path/file.py', 'Python')
    assert r is None


def test_function_and_class():
    content = 'class Foo:\n    def bar(self):\n        pass\n'
    path = make_file(content)
    try:
        r = analyze_file(path, 'Python')
        assert r['functions'] == 1
        assert r['classes'] == 1
    finally:
        os.unlink(path)
