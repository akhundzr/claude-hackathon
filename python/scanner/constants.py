IGNORE_DIRS = frozenset({'.git', 'node_modules', '__pycache__', 'venv', '.env', 'dist', 'build'})

EXTENSION_MAP = {
    ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
    ".jsx": "JSX", ".tsx": "TSX", ".java": "Java",
    ".c": "C", ".cpp": "C++", ".cc": "C++", ".cxx": "C++",
    ".h": "C/C++ Header", ".hpp": "C/C++ Header",
    ".cs": "C#", ".go": "Go", ".rs": "Rust", ".rb": "Ruby",
    ".php": "PHP", ".swift": "Swift", ".kt": "Kotlin", ".kts": "Kotlin",
    ".scala": "Scala", ".r": "R", ".R": "R", ".m": "Objective-C",
    ".lua": "Lua", ".pl": "Perl", ".pm": "Perl",
    ".sh": "Shell", ".bash": "Shell", ".zsh": "Shell",
    ".html": "HTML", ".htm": "HTML", ".css": "CSS",
    ".scss": "SCSS/Sass", ".sass": "SCSS/Sass", ".sql": "SQL",
    ".json": "JSON", ".xml": "XML", ".yaml": "YAML", ".yml": "YAML",
    ".toml": "TOML", ".md": "Markdown", ".markdown": "Markdown",
    ".txt": "Text", ".dockerfile": "Dockerfile", ".tf": "Terraform",
}

SMELL_THRESHOLDS = {
    'long_function': {'warning': 30, 'error': 60},
    'deep_nesting': {'warning': 4, 'error': 6},
    'long_parameter_list': {'warning': 4, 'error': 7},
}

GRADE_BOUNDARIES = [(90, 'A'), (80, 'B'), (70, 'C'), (60, 'D'), (0, 'F')]
