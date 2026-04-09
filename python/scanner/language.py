import os
from .constants import EXTENSION_MAP


def detect(path: str) -> str:
    base = os.path.basename(path)
    if base.lower() == 'dockerfile':
        return 'Dockerfile'
    _, ext = os.path.splitext(base)
    return EXTENSION_MAP.get(ext, EXTENSION_MAP.get(ext.lower(), 'unknown'))
