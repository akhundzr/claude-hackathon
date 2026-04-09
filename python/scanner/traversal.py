import os
import sys
from .constants import IGNORE_DIRS


def walk(root: str, no_ignore: bool = False) -> tuple[list[str], int]:
    """Return (list of file paths, skipped_count) for the given root directory."""
    files: list[str] = []
    skipped = [0]

    def _scan(dirpath: str) -> None:
        try:
            with os.scandir(dirpath) as it:
                entries = list(it)
        except (PermissionError, OSError) as exc:
            print(f"Warning: cannot read directory {dirpath}: {exc}", file=sys.stderr)
            skipped[0] += 1
            return

        subdirs: list[str] = []
        for entry in entries:
            if not no_ignore and entry.name in IGNORE_DIRS:
                continue
            if entry.is_symlink():
                continue
            try:
                if entry.is_dir(follow_symlinks=False):
                    subdirs.append(entry.path)
                elif entry.is_file(follow_symlinks=False):
                    files.append(entry.path)
            except OSError:
                skipped[0] += 1

        for sub in subdirs:
            _scan(sub)

    _scan(root)
    return files, skipped[0]
