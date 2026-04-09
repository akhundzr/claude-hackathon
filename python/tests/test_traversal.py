import os
import tempfile
import pytest
from scanner.traversal import walk


def test_files_returned():
    with tempfile.TemporaryDirectory() as d:
        open(os.path.join(d, 'app.py'), 'w').close()
        open(os.path.join(d, 'main.js'), 'w').close()
        files, skipped = walk(d)
        assert len(files) == 2
        assert skipped == 0


def test_ignore_dirs():
    with tempfile.TemporaryDirectory() as d:
        nm = os.path.join(d, 'node_modules')
        os.makedirs(nm)
        open(os.path.join(nm, 'pkg.js'), 'w').close()
        open(os.path.join(d, 'app.py'), 'w').close()
        files, skipped = walk(d)
        assert len(files) == 1
        assert files[0].endswith('app.py')


def test_all_ignore_dirs():
    ignore_names = ['.git', 'node_modules', '__pycache__', 'venv', '.env', 'dist', 'build']
    with tempfile.TemporaryDirectory() as d:
        for name in ignore_names:
            subdir = os.path.join(d, name)
            os.makedirs(subdir)
            open(os.path.join(subdir, 'file.py'), 'w').close()
        open(os.path.join(d, 'keep.py'), 'w').close()
        files, _ = walk(d)
        assert len(files) == 1


def test_symlinks_not_followed():
    with tempfile.TemporaryDirectory() as d:
        real = os.path.join(d, 'real.py')
        open(real, 'w').close()
        link = os.path.join(d, 'link.py')
        os.symlink(real, link)
        files, skipped = walk(d)
        assert len(files) == 1
        assert os.path.basename(files[0]) == 'real.py'


def test_recursive_walk():
    with tempfile.TemporaryDirectory() as d:
        sub = os.path.join(d, 'sub')
        os.makedirs(sub)
        open(os.path.join(d, 'a.py'), 'w').close()
        open(os.path.join(sub, 'b.py'), 'w').close()
        files, skipped = walk(d)
        assert len(files) == 2
        assert skipped == 0


def test_unreadable_dir_counted():
    with tempfile.TemporaryDirectory() as d:
        sub = os.path.join(d, 'secret')
        os.makedirs(sub)
        open(os.path.join(sub, 'file.py'), 'w').close()
        os.chmod(sub, 0o000)
        try:
            files, skipped = walk(d)
            assert skipped >= 1
        finally:
            os.chmod(sub, 0o755)
