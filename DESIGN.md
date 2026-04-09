# DESIGN.md — Code Scanner CLI

## 1. Project Overview and Goals

This project delivers a CLI code scanner that accepts a directory path, recursively analyzes all source files, and produces a structured JSON report plus an animated HTML dashboard. The scanner extracts quantitative metrics (LOC, comments, blanks, function/class counts), detects code smells, flags security issues, and computes a composite quality score (0–100, letter grade A–F).

**Goals:**
- Provide instant, zero-config codebase health assessment from the command line.
- Surface actionable findings: code smells, security risks, and quality grades.
- Deliver a visually rich HTML report that auto-opens in the user's browser.
- Maintain two parallel implementations (Python and JavaScript) for comparison.

---

## 2. Architecture Diagram

```
 CLI Entry Point
       |
       v
 +------------------+
 |  Argument Parser  |   scanner scan ./path [--output report.html] [--no-open]
 +------------------+
       |
       v
 +------------------+
 |  File Traversal   |   Recursive walk, hardcoded ignore list
 +------------------+
       |
       v
 +------------------+
 | Language Detector  |   Extension -> language mapping
 +------------------+
       |
       v
 +-------------------------------+
 |        Per-File Analysis       |
 |  +----------+ +-----------+   |
 |  | Metrics  | | Smell     |   |
 |  | Extractor| | Detector  |   |
 |  +----------+ +-----------+   |
 |  +----------+ +-----------+   |
 |  | Security | | Quality   |   |
 |  | Scanner  | | Scorer    |   |
 |  +----------+ +-----------+   |
 +-------------------------------+
       |
       v
 +------------------+
 |  Aggregator       |   Rolls file-level data into project-level summary
 +------------------+
       |
       +------------+------------+
       |                         |
       v                         v
 +-------------+         +--------------+
 | JSON Output |         | HTML Report  |
 |  (stdout /  |         | Generator    |
 |   file)     |         | (+ auto-open)|
 +-------------+         +--------------+
```

---

## 3. Module Breakdown

### Python Implementation (`python/`)

| File | Responsibility |
|---|---|
| `scanner/__main__.py` | Entry point. Wires CLI parsing to the scan pipeline. |
| `scanner/cli.py` | Argument parsing via `argparse`. Validates paths, sets defaults. |
| `scanner/traversal.py` | Recursive directory walk with ignore filtering. Yields file paths. |
| `scanner/language.py` | Maps file extensions to language names. Returns `"unknown"` for unmapped extensions. |
| `scanner/metrics.py` | Per-file extraction: LOC, comment lines, blank lines, function count, class count. |
| `scanner/smells.py` | Code smell detection: long functions, deep nesting, long parameter lists. |
| `scanner/security.py` | Security scanning: hardcoded secrets, dangerous function calls. |
| `scanner/quality.py` | Composite quality score calculation (0–100) and letter grade assignment. |
| `scanner/aggregator.py` | Combines per-file results into project-level summary with totals and averages. |
| `scanner/report_json.py` | Serializes aggregated data to JSON (to stdout or file). |
| `scanner/report_html.py` | Generates self-contained HTML report with embedded CSS/JS and Chart.js visualizations. |
| `scanner/constants.py` | Shared constants: ignore list, extension map, thresholds, grade boundaries. |

### JavaScript Implementation (`javascript/`)

| File | Responsibility |
|---|---|
| `src/index.js` | Entry point. |
| `src/cli.js` | Argument parsing via `commander`. |
| `src/traversal.js` | Recursive directory walk using `fs.readdirSync` with ignore filtering. |
| `src/language.js` | Extension-to-language mapping. |
| `src/metrics.js` | Per-file metric extraction. |
| `src/smells.js` | Code smell detection. |
| `src/security.js` | Security scanning. |
| `src/quality.js` | Quality scoring. |
| `src/aggregator.js` | Aggregation of per-file results. |
| `src/reportJson.js` | JSON output. |
| `src/reportHtml.js` | HTML report generation. |
| `src/constants.js` | Shared constants. |

---

## 4. CLI Interface Spec

```
scanner scan <directory> [--output <path>] [--no-open]
```

| Argument / Flag | Required | Default | Description |
|---|---|---|---|
| `<directory>` | Yes | N/A | Path to directory to scan. Relative or absolute. |
| `--output` | No | `./report.html` | File path for the HTML report. |
| `--no-open` | No | false (auto-open enabled) | When present, suppresses automatic browser opening. |

**Behavior:**
1. Parse arguments. Exit with code 1 and a usage message if `<directory>` is missing or path does not exist.
2. Run the scan pipeline.
3. Print JSON results to stdout.
4. Write HTML report to the `--output` path.
5. Unless `--no-open` is set, open the HTML report in the default browser (`webbrowser.open` in Python, platform-appropriate in Node).
6. Exit with code 0 on success.

---

## 5. File Traversal Logic

### Hardcoded Ignore List

The following are skipped during traversal (matched on base name):

```
.git
node_modules
__pycache__
venv
.env
dist
build
```

### Recursion Strategy
1. Accept the root directory path.
2. Use depth-first recursive walk (`os.walk` in Python, `fs.readdirSync` + recursion in JS).
3. At each level, filter out entries whose base name is in the ignore list before descending.
4. Symlinks are **not** followed.
5. Unreadable files are logged to stderr, skipped, and counted in `skipped_files`.

---

## 6. Language Detection Table

Mapping performed on lowercased file extension. Unknown extensions → `"unknown"`.

| Extension(s) | Language |
|---|---|
| `.py` | Python |
| `.js` | JavaScript |
| `.ts` | TypeScript |
| `.jsx` | JSX |
| `.tsx` | TSX |
| `.java` | Java |
| `.c` | C |
| `.cpp`, `.cc`, `.cxx` | C++ |
| `.h`, `.hpp` | C/C++ Header |
| `.cs` | C# |
| `.go` | Go |
| `.rs` | Rust |
| `.rb` | Ruby |
| `.php` | PHP |
| `.swift` | Swift |
| `.kt`, `.kts` | Kotlin |
| `.scala` | Scala |
| `.r`, `.R` | R |
| `.m` | Objective-C |
| `.lua` | Lua |
| `.pl`, `.pm` | Perl |
| `.sh`, `.bash`, `.zsh` | Shell |
| `.html`, `.htm` | HTML |
| `.css` | CSS |
| `.scss`, `.sass` | SCSS/Sass |
| `.sql` | SQL |
| `.json` | JSON |
| `.xml` | XML |
| `.yaml`, `.yml` | YAML |
| `.toml` | TOML |
| `.md`, `.markdown` | Markdown |
| `.txt` | Text |
| `.dockerfile` / `Dockerfile` | Dockerfile |
| `.tf` | Terraform |

---

## 7. Metrics Specification

### Lines of Code (LOC)
Any line that is not blank and not a pure comment line. A line with both code and an inline comment counts as a code line.

### Comment Lines
Lines containing **only** a comment (plus optional leading whitespace).

| Language(s) | Single-line | Block |
|---|---|---|
| Python, Ruby, Shell, R | `#` | `"""..."""` / `'''...'''` |
| JS, TS, Java, C, C++, C#, Go, Rust, Swift, Kotlin, PHP | `//` | `/* ... */` |
| HTML, XML | N/A | `<!-- ... -->` |
| CSS, SCSS | `//` | `/* ... */` |
| SQL | `--` | `/* ... */` |

### Blank Lines
Lines containing only whitespace or completely empty.

### Function Count
Detected by regex per language:

| Language | Pattern |
|---|---|
| Python | `^\s*def\s+\w+\s*\(` |
| JS/TS | `^\s*(function\s+\w+\|const\s+\w+\s*=\s*(function\|\([^)]*\)\s*=>\|\w+\s*=>)\|(async\s+function\s+\w+))` |
| Go | `^\s*func\s+` |
| Rust | `^\s*fn\s+\w+\s*\(` |
| Ruby | `^\s*def\s+\w+` |
| Java/C#/Kotlin | `(public\|private\|protected).*\w+\s*\(` |
| Shell | `^\s*\w+\s*\(\)` |

### Class Count

| Language | Pattern |
|---|---|
| Python, JS/TS, Ruby, PHP, C++ | `^\s*class\s+\w+` |
| Java, C#, Kotlin | `^\s*(public\|private\|protected)?\s*(abstract\|final)?\s*class\s+\w+` |
| Go | `^\s*type\s+\w+\s+struct\s*\{` |
| Rust | `^\s*struct\s+\w+` |

---

## 8. Analysis Feature Specs

### 8a. Code Smell Detection

| Smell | Scope | Warning Threshold | Error Threshold |
|---|---|---|---|
| Long Function | Per function | > 30 lines | > 60 lines |
| Deep Nesting | Per function | > 4 levels | > 6 levels |
| Long Parameter List | Per function | > 4 parameters | > 7 parameters |

Each finding records: `type`, `severity`, `file`, `line`, `function_name`, `detail`, `value`.

**Nesting depth:** Computed as `leading_spaces / 4` (or 1 per tab). Tracked as the maximum depth reached within a function body.

### 8b. Security Scanning

#### Hardcoded Secrets

| Pattern Name | Regex |
|---|---|
| AWS Access Key | `(?i)(aws_access_key_id\|aws_secret_access_key)\s*[=:]\s*['"]?[A-Za-z0-9/+=]{20,}` |
| API Key Assignment | `(?i)(api[_-]?key\|apikey\|api[_-]?secret)\s*[=:]\s*['"]?[A-Za-z0-9_\-]{16,}` |
| Password Assignment | `(?i)(password\|passwd\|pwd)\s*[=:]\s*['"][^'"]{4,}['"]` |
| Private Key | `-----BEGIN (RSA\|DSA\|EC\|OPENSSH)? ?PRIVATE KEY-----` |
| Generic Token | `(?i)(token\|secret\|auth[_-]?key)\s*[=:]\s*['"]?[A-Za-z0-9_\-]{16,}` |
| Connection String | `(?i)(mongodb\+srv\|postgres\|mysql\|redis):\/\/[^\s'"]+` |

#### Dangerous Function Calls

| Pattern | Language(s) | Risk |
|---|---|---|
| `eval()` | Python, JS | Arbitrary code execution |
| `exec()` | Python | Arbitrary code execution |
| `os.system()` | Python | Shell injection |
| `subprocess` with `shell=True` | Python | Shell injection |
| `.innerHTML =` | JS | XSS |
| `dangerouslySetInnerHTML` | JSX/TSX | XSS |
| `document.write()` | JS | XSS |
| `child_process.exec` | JS | Shell injection |
| `pickle.loads` | Python | Deserialization attack |
| `yaml.load` (without Loader) | Python | Unsafe deserialization |
| `strcpy`, `strcat`, `gets` | C/C++ | Buffer overflow |

Severity: secrets → `"error"`, dangerous calls → `"warning"`.

### 8c. Quality Scoring

#### Component Weights

| Component | Weight |
|---|---|
| Code Smell Score | 30% |
| Security Score | 25% |
| Comment Ratio Score | 20% |
| Maintainability Score | 25% |

#### Sub-Score Formulas

**Code Smell Score:**
```
smell_density = (warnings * 1 + errors * 2) / max(total_functions, 1)
code_smell_score = max(0, 100 - (smell_density * 50))
```

**Security Score:**
```
security_score = max(0, 100 - (secret_count * 20) - (dangerous_call_count * 10))
```

**Comment Ratio Score:**
```
ratio = total_comment_lines / max(total_loc, 1)
if ratio < 0.05:    score = ratio / 0.05 * 40          # 0–40
elif ratio <= 0.30: score = 40 + (ratio - 0.05) / 0.25 * 60  # 40–100
else:               score = max(60, 100 - (ratio - 0.30) * 200)  # penalize over-commenting
```

**Maintainability Score:**
```
avg_fn_len = total_function_lines / max(total_functions, 1)
length_score = 100 if avg_fn_len <= 20
             else max(0, 100 - ((avg_fn_len - 20) / 30 * 50))  if avg_fn_len <= 50
             else max(0, 50 - ((avg_fn_len - 50) / 50 * 50))

avg_file_loc = total_loc / max(total_files, 1)
file_score = 100 if avg_file_loc <= 200
           else max(0, 100 - ((avg_file_loc - 200) / 300 * 40))  if avg_file_loc <= 500
           else max(0, 60 - ((avg_file_loc - 500) / 500 * 60))

maintainability_score = (length_score * 0.6) + (file_score * 0.4)
```

**Composite:**
```
quality_score = round(
    code_smell_score * 0.30 +
    security_score   * 0.25 +
    comment_score    * 0.20 +
    maintainability_score * 0.25
)
```

#### Grade Boundaries

| Grade | Score Range |
|---|---|
| A | 90–100 |
| B | 80–89 |
| C | 70–79 |
| D | 60–69 |
| F | 0–59 |

---

## 9. JSON Output Schema

```json
{
  "scan_metadata": {
    "directory": "/absolute/path",
    "timestamp": "2026-04-09T14:30:00Z",
    "total_files_scanned": 142,
    "skipped_files": 3,
    "scan_duration_ms": 1523
  },
  "summary": {
    "total_loc": 12450,
    "total_comment_lines": 1830,
    "total_blank_lines": 2100,
    "total_files": 142,
    "total_functions": 387,
    "total_classes": 42,
    "languages": {
      "Python": {
        "files": 45,
        "loc": 5200,
        "comment_lines": 980,
        "blank_lines": 870,
        "functions": 180,
        "classes": 22
      }
    }
  },
  "quality": {
    "score": 74,
    "grade": "C",
    "components": {
      "code_smell_score": 68,
      "security_score": 80,
      "comment_score": 72,
      "maintainability_score": 76
    }
  },
  "code_smells": {
    "total_warnings": 12,
    "total_errors": 3,
    "findings": [
      {
        "type": "long_function",
        "severity": "error",
        "file": "src/parser.py",
        "line": 45,
        "function_name": "parse_document",
        "detail": "Function is 85 lines (threshold: 60 for error)",
        "value": 85
      }
    ]
  },
  "security": {
    "total_findings": 4,
    "findings": [
      {
        "type": "hardcoded_secret",
        "severity": "error",
        "file": "config/settings.py",
        "line": 12,
        "pattern": "api_key_assignment",
        "detail": "Possible hardcoded API key",
        "snippet": "API_KEY = \"sk-abc123...\""
      }
    ]
  },
  "files": [
    {
      "path": "src/parser.py",
      "language": "Python",
      "loc": 210,
      "comment_lines": 35,
      "blank_lines": 40,
      "functions": 8,
      "classes": 1,
      "smells": 2,
      "security_issues": 0
    }
  ]
}
```

---

## 10. HTML Report Spec

Single self-contained file. CDN libraries: **Chart.js 4.x**, **Animate.css 4.x**.

### Sections (top to bottom)

1. **Header Banner** — animated SVG quality gauge (stroke-dashoffset, 0→score, 1.5s ease-out), letter grade large inside gauge, gauge color transitions red→yellow→green. Scan summary: total files, LOC, duration.
2. **Quality Score Breakdown** — horizontal bar chart (Chart.js), bars animate left-to-right on scroll (IntersectionObserver), color-coded green/yellow/red by threshold.
3. **Language Distribution** — doughnut chart (Chart.js), rotation animation 1.2s, hover expands segment with tooltip.
4. **Metrics Summary Table** — Language/Files/LOC/Comments/Blanks/Functions/Classes, rows fade-in with staggered 100ms delay, sortable columns (vanilla JS).
5. **Code Smells Panel** — count-up badge animation (0→N, 800ms), expandable findings grouped by type, slide-in from left on expand.
6. **Security Findings Panel** — same pattern as smells, snippets in monospace, offending portion highlighted. Zero findings → green checkmark with fade-in.
7. **File Explorer** — searchable (real-time filter), sortable, 50-per-page pagination, colored left-border for files with issues (red=error, yellow=warning).
8. **Footer** — timestamp, scan duration, "Generated by Code Scanner".

### Styling
- **Dark theme default**, light mode toggle (stored in `localStorage`)
- Color palette: bg `#1a1a2e`, card `#16213e`, accent `#0f3460`, highlight `#e94560`
- Responsive (single-column below 768px)
- System font stack
- All animations respect `prefers-reduced-motion: reduce`
- No animation exceeds 1.5s; no infinite loops except subtle pulse on letter grade

---

## 11. Unit Test Strategy

Unit tests cover the critical scanner paths in both implementations. Tests live alongside implementation code in a `tests/` subdirectory within each implementation branch.

### Critical Paths to Test

| Module | What to Test |
|---|---|
| `traversal` | Ignore list respected; symlinks not followed; unreadable files counted in `skipped_files` |
| `language` | Known extensions map correctly; unknown → `"unknown"`; case-insensitive |
| `metrics` | LOC/comment/blank counts for Python, JS, and a generic file; inline comments counted as code |
| `smells` | Long function detection at warning and error threshold; deep nesting; long parameter list |
| `security` | Each hardcoded secret pattern matches an example; dangerous function patterns match |
| `quality` | Score boundaries (0, 50, 100); grade assignment at each boundary |
| `aggregator` | Multi-file rollup totals and per-language breakdown |
| `report_json` | Output is valid JSON and matches schema in Section 9 |

### Test Fixtures

A `tests/fixtures/` directory contains synthetic source files with known properties (e.g., a file with exactly 3 functions, one of which is 65 lines, one hardcoded secret). Tests run the scanner on fixtures and assert against expected values rather than mocking internals.

### Python
- Framework: `pytest`
- Run: `pytest python/tests/`
- No external test dependencies beyond pytest.

### JavaScript
- Framework: `node:test` (Node 18+ built-in)
- Run: `node --test javascript/tests/`
- No additional npm test dependencies.

---

## 12. Model Strategy

Model selection is applied per task type throughout the build:

| Task Type | Model | Rationale |
|---|---|---|
| Architecture design, trade-off analysis, complex reasoning | Opus 4.6 (`claude-opus-4-6`) | Strongest reasoning; used for planning phases |
| Implementation, coding, iteration, refactoring | Sonnet 4.6 (`claude-sonnet-4-6`) | Balanced speed/quality for the bulk of coding work |
| Simple tasks, boilerplate, file searches, quick lookups | Haiku 4.5 (`claude-haiku-4-5-20251001`) | Fastest; appropriate for low-complexity tasks |

When spawning subagents via Claude Code's `Agent` tool, the `model` parameter is set explicitly rather than inheriting the default. Parallel subagents doing independent implementation tasks each get Sonnet; any subagent doing design review or architecture critique gets Opus.

---

## 13. Custom Command

A reusable `/scan-check` custom command is encoded in `.claude/commands/scan-check.md`. It runs the scanner against the `tests/fixtures/` directory and validates the JSON output matches the Section 9 schema.

**Usage:** `/scan-check`

**What it does:**
1. Runs `python -m scanner scan tests/fixtures/ --no-open` (or the JS equivalent).
2. Validates the JSON output contains all required top-level keys (`scan_metadata`, `summary`, `quality`, `code_smells`, `security`, `files`).
3. Confirms at least one smell and one security finding are present (fixtures guarantee this).
4. Reports pass/fail with a one-line summary.

**Why encode this:** It's the primary alignment check after any change to the analysis pipeline. Running it takes 2 seconds and catches regressions before they become debugging sessions.

---

## 14. Skill

A `/simplify` skill review pass is applied after each implementation phase is complete. Before committing a phase, run `/simplify` against the changed files to catch:

- Functions that can be replaced with stdlib calls
- Repeated logic that can be extracted
- Over-engineered patterns (premature abstraction, unnecessary layers)

This is applied per-phase (traversal, analysis, reporting) rather than at the end of the build, so complexity is controlled incrementally.

---

## 15. Worktree Strategy

| Branch | Worktree Path | Contents |
|---|---|---|
| `main` | repo root | `README.md`, `DESIGN.md`, `CLAUDE.md` |
| `python-impl` | `../claude-hackathon-python/` | Full Python implementation |
| `js-impl` | `../claude-hackathon-js/` | Full JS/Node.js implementation |

**Rules:**
- `DESIGN.md` and `CLAUDE.md` live on `main` only.
- Both implementations must produce **identical JSON output** for the same input — the schema in Section 9 is the contract.
- HTML reports may differ visually but must contain all the same data sections.

---

## 16. Tech Stack

### Python
| Concern | Tool |
|---|---|
| CLI parsing | `argparse` (stdlib) |
| File traversal | `os.walk` (stdlib) |
| JSON output | `json` (stdlib) |
| HTML generation | f-strings / `string.Template` (stdlib) |
| Browser opening | `webbrowser` (stdlib) |
| Pattern matching | `re` (stdlib) |
| Charts | Chart.js 4.x (CDN in generated HTML) |
| Animations | Animate.css 4.x (CDN in generated HTML) |
| Python version | 3.10+ |

**Zero external Python dependencies.**

### JavaScript / Node.js
| Concern | Tool |
|---|---|
| CLI parsing | `commander` ^12.0 |
| File traversal | `fs` + `path` (stdlib) |
| Browser opening | `open` ^10.0 (npm) |
| Charts | Chart.js 4.x (CDN in generated HTML) |
| Node version | 18+ LTS |

**2 external npm dependencies.**

---

## Appendix A: Threshold Quick Reference

| Metric | Warning | Error |
|---|---|---|
| Function length (lines) | > 30 | > 60 |
| Nesting depth (levels) | > 4 | > 6 |
| Parameter count | > 4 | > 7 |
| Hardcoded secret | — | Always error |
| Dangerous function call | Always warning | — |

## Appendix B: Full Extension Map

```python
{
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
  ".txt": "Text", ".dockerfile": "Dockerfile", ".tf": "Terraform"
}
```
