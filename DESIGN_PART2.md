# DESIGN_PART2.md — AI-Powered Refactoring Assistant, PostToolUse Hook, and Infrastructure Artifact

## 1. Overview

Part I delivered a CLI code scanner that traverses a directory, extracts per-file metrics (LOC, comments, blanks, functions, classes), detects code smells (long functions, deep nesting, long parameter lists), flags security issues (hardcoded secrets, dangerous calls), computes a composite quality score (0–100, letter grade A–F), and generates both JSON output and a self-contained HTML dashboard.

Part II adds three things on top of that foundation:

1. **Refactoring Assistant** (`scanner refactor <dir>`) — an AI-powered workflow that identifies the worst-scoring functions from a scan, sends them to Claude for concrete refactoring suggestions, presents a diff for user approval, writes the changes, and re-scans to prove the quality score improved. This is the creative extension.

2. **PostToolUse Hook** — a hook that fires after every file write during a Claude Code agent session, automatically re-scans the modified file, and prints the quality delta (score before vs. after). This closes the feedback loop without manual intervention.

3. **Infrastructure Artifact** — enhanced `CLAUDE.md` ground rules encoding Part II learnings, a `/scan-refactor` custom command that encodes the refactoring workflow, and `/insights` findings encoded as persistent rules.

Together these form a closed loop: the scanner identifies problems, the AI fixes them, the hook verifies improvement automatically, and the infrastructure artifact ensures agents follow these patterns in fresh sessions.

---

## 2. Refactoring Assistant Architecture

### 2.1 CLI Flow

A new `refactor` subcommand is added alongside the existing `scan` subcommand:

```
scanner refactor <dir> [--top N] [--auto] [--model <model>] [--dry-run]
```

| Flag | Default | Description |
|---|---|---|
| `<dir>` | required | Directory to scan and refactor |
| `--top N` | 3 | Number of worst-scoring functions to refactor |
| `--auto` | false | Auto-accept all suggestions (skip interactive approval) |
| `--model` | `claude-sonnet-4-6` | Claude model to use for refactoring suggestions |
| `--dry-run` | false | Show diffs but do not write changes |

**Decision: separate subcommand, not a flag.** The refactor workflow has its own lifecycle (scan, analyze, suggest, approve, write, re-scan) distinct from the scan-and-report flow. A subcommand keeps the CLI clean and avoids overloading `scan` with unrelated flags.

**Decision: process one function at a time, sequentially.** Batching N functions into a single Claude call risks the model conflating changes across files. Sequential processing also lets the re-scan after each function reflect the cumulative improvement, which is more demoable ("watch the score climb").

### 2.2 Module Breakdown

New files to create inside `javascript/src/`:

| File | Responsibility |
|---|---|
| `src/extractor.js` | Given a smell finding (file, line, function_name), extract the full function body text and surrounding context |
| `src/claude.js` | Claude API client: builds prompts, calls the API, parses structured responses |
| `src/diff.js` | Generate a colorized unified diff between original and refactored code; display in terminal |
| `src/prompt.js` | Prompt templates for the refactoring assistant (system prompt, user prompt, response format instructions) |
| `src/refactor.js` | Orchestrator: scan, rank functions, loop through top-N calling Claude, present diff, apply, re-scan |

Modified files:

| File | Change |
|---|---|
| `src/cli.js` | Add the `refactor` subcommand with its flags |
| `src/smells.js` | Add a `rankByWorst` helper that sorts smell findings by severity then value descending |
| `package.json` | Add `@anthropic-ai/sdk` dependency |

### 2.3 Function Extraction Strategy

The smell findings already contain `file`, `line` (1-indexed start line), and `function_name`. The existing `findFunctions` in `smells.js` computes `startLine` and `bodyLines` for each function. The extraction strategy:

1. Re-run `findFunctions(lines, language)` on the target file to get the full function list with `startLine` and `bodyLines`.
2. Find the matching function by `startLine` (or `name` + `startLine` for safety).
3. Extract `lines[startLine - 1]` through `lines[startLine - 1 + bodyLines]` as the function body.
4. Also extract 5 lines of context before the function start (imports, preceding code) for the AI to understand the environment.
5. Return an object: `{ filePath, language, functionName, startLine, endLine, body, context, fullFileContent }`.

**Why not use AST parsing?** This is a hackathon. The existing regex-based `findFunctions` already works across many languages. An AST parser would be more accurate but would require language-specific parsers (acorn for JS, tree-sitter for multi-language). The regex approach is good enough for a demo and keeps dependencies minimal.

**Edge case:** If `findFunctions` cannot find the exact function (e.g., the file was modified between scan and extract), fall back to extracting a window of `startLine ± bodyLines` lines and let Claude figure out the boundaries.

### 2.4 Claude API Integration

**Model choice:** `claude-sonnet-4-6` (default). Sonnet is fast enough for interactive use (2–5 seconds per function) and produces high-quality refactoring suggestions. Users can override with `--model claude-opus-4-6` for harder cases.

**SDK:** `@anthropic-ai/sdk` (official Anthropic Node.js SDK). The API key comes from the `ANTHROPIC_API_KEY` environment variable, which the SDK reads automatically.

**Prompt structure:**

```javascript
// System prompt (src/prompt.js)
const SYSTEM_PROMPT = `You are a senior software engineer performing code refactoring.
You receive a function that has been flagged by a code quality scanner.
Your job is to refactor it to address the specific issues identified.

Rules:
- Preserve the function's external behavior (same inputs, same outputs)
- Keep the same function name and parameter signature unless the issue IS the parameter list
- Return ONLY the refactored function code, no explanations before or after
- Use the same coding style (indentation, naming conventions) as the original
- If the function requires splitting into multiple functions, include all of them
- Do not add comments explaining the refactoring — the code should be self-explanatory`;

// User prompt template
const USER_PROMPT = `Language: {{language}}
File: {{filePath}}

## Issue identified
{{smellType}}: {{smellDetail}}

## Context (preceding code)
\`\`\`{{language}}
{{context}}
\`\`\`

## Function to refactor
\`\`\`{{language}}
{{functionBody}}
\`\`\`

Return the refactored code inside a single fenced code block.`;
```

**Response parsing:** Extract the content between the first pair of triple-backtick fences in the response. If no fences are found, use the entire response text. Strip any language identifier after the opening fence.

**Error handling:**
- If `ANTHROPIC_API_KEY` is not set, print a clear error message and exit with code 1.
- If the API call fails (rate limit, network error), retry once after 2 seconds, then skip the function with a warning.
- If the response does not contain valid code (empty, or no code block), skip with a warning.

### 2.5 Apply-Refactor Strategy

After Claude returns the refactored code:

1. **Show the diff.** Use a simple unified diff computed in `src/diff.js`. Color-code with ANSI escape codes: red for removed lines, green for added lines.

2. **Prompt for approval.** Unless `--auto` is set, ask the user:
   ```
   Apply this refactoring? [y/n/s(kip all)]
   ```
   - `y` — write the change
   - `n` — skip this function
   - `s` — skip all remaining functions

3. **Write the change.** Read the full file content, replace the lines from `startLine` to `endLine` with the refactored code, write back using `writeFileSync`.

4. **Re-scan.** Run the scanner on the single file to get updated quality metrics. Single-file scan takes <10ms.

**Decision: replace at exact line ranges, not string matching.** String matching is fragile (duplicate code, whitespace differences). Line-range replacement is deterministic because we know the exact start and end lines from the extraction step.

**Decision: no git integration for the initial implementation.** The `--dry-run` flag is sufficient safety for the demo. Users can use git themselves.

### 2.6 Quality Delta Display

After all refactoring is complete, display a summary table:

```
=== Refactoring Summary ===

  Function                  File                    Issue             Before    After
  ────────────────────────  ──────────────────────  ────────────────  ────────  ────────
  long_function_example     sample.py               long_function     63 lines  18 lines
  processData               sample.js               deep_nesting      5 levels  2 levels
  medium_function           sample.py               long_param_list   5 params  2 params

  Overall Quality Score:  62 → 78  (+16)  Grade: D → C
```

### 2.7 Execution Flow

```
1. Parse CLI args (dir, top, auto, model, dry-run)
2. Run full scan on dir → get report
3. Collect all smell findings, sort by severity (error first) then value (descending)
4. Take top N findings
5. Record baseline quality score
6. For each finding (max 2 retries per function):
   a. Extract function body + context via extractor.js
   b. Build prompt via prompt.js
      - On retry: append "Previous attempt did not improve the score.
        The issue was: {{smell}}. Try a different approach." to the user prompt.
   c. Call Claude API via claude.js
   d. Parse refactored code from response
   e. Generate and display diff via diff.js
   f. If not --auto, prompt user for approval
   g. If approved and not --dry-run, write refactored code to file
   h. Re-scan the modified file, record new score
   i. If score did not improve (same or worse):
        - Restore original file content
        - If attempts < 3: increment attempt counter, go back to step (a)
        - If attempts == 3: print warning "Could not improve [function] after 3 attempts — skipping"
                           and continue to next finding
   j. Print per-function delta
7. Run full scan on dir → get final report
8. Print summary table with overall quality delta
```

**Exit condition:** Each function gets at most 3 attempts (1 initial + 2 retries). If no attempt improves the score, the original file is restored and the loop moves on. This prevents infinite iteration on genuinely hard cases and keeps the demo from stalling.

---

## 3. PostToolUse Hook Design

### 3.1 What the Hook Does

A `PostToolUse` hook that fires after every file write (when the tool name is `Write` or `Edit`), automatically runs the scanner on the modified file's parent directory, and prints the quality score delta compared to the last recorded score.

### 3.2 Hook Configuration Format

The hook is configured in `.claude/settings.json` (project-level):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "node javascript/src/hooks/postToolUse.js \"$CLAUDE_FILE_PATH\""
      }
    ]
  }
}
```

### 3.3 Hook Script Logic

New file: `javascript/src/hooks/postToolUse.js`

```
1. Receive file path from CLI argument or environment variable
2. Determine the file's parent directory
3. Check if the file has a recognized extension (from EXTENSION_MAP)
   - If not (e.g., .md, .json config), exit silently
4. Read the last recorded score from state file (/tmp/.scanner-hook-state.json)
5. Run scanner on the parent directory (reuse scan pipeline programmatically)
6. Compute quality score
7. Compare to last recorded score
8. Print delta to stderr:
   - If improved:  "✓ Quality: 72 → 78 (+6) [B]"
   - If unchanged: "= Quality: 72 (unchanged) [C]"
   - If degraded:  "⚠ Quality: 72 → 68 (-4) [D]"
9. Write new score to state file
```

### 3.4 State Management

**Decision: use a temp file at `/tmp/.scanner-hook-state.json`.** Environment variables do not persist across hook invocations. A temp file in `/tmp` is fast to read/write and naturally cleans up on reboot.

State file format:
```json
{
  "lastScore": 72,
  "lastGrade": "C",
  "lastScanTime": "2026-04-09T14:30:00Z",
  "directory": "/path/to/scanned/dir"
}
```

If the state file does not exist (first run), the hook runs the scan, records the score, and prints only the current score (no delta). If the directory in the state file differs from the current file's directory, reset state.

### 3.5 Performance Considerations

**Scope the scan narrowly.** The hook scans only the modified file's parent directory (one level), not the entire project tree. For a typical `src/` directory with 10–20 files, this takes <50ms.

**Exit quickly for non-code files.** The hook checks the file extension before scanning. Writes to `.md`, `.json`, `.yaml`, or other non-code files exit immediately.

---

## 4. Infrastructure Artifact Plan

### 4.1 Enhanced CLAUDE.md Ground Rules

Add these Part II-specific rules to `CLAUDE.md`:

**Rule 4: Run the Scanner as a Feedback Signal**
After modifying any source file in `javascript/src/`, run the scanner on that directory and check that the quality score has not decreased. If it has, fix the regression before proceeding.

**Rule 5: Refactoring Must Preserve Behavior**
When refactoring a function, the function's external behavior must not change. Same inputs must produce same outputs. If the function has tests, run them after refactoring.

**Rule 6: Claude API Usage Conventions**
- Always read the API key from `ANTHROPIC_API_KEY` (never hardcode keys).
- Use `claude-sonnet-4-6` for implementation tasks, `claude-opus-4-6` for reasoning/planning.
- Always include a system prompt that constrains the response format.
- Handle rate limits with a single retry after 2 seconds, then fail gracefully.

**Rule 7: Hook Scripts Must Be Fast**
Any PostToolUse hook script must complete in under 500ms. If it exceeds this, scope the work more narrowly.

### 4.2 Custom Command: `/scan-refactor`

Location: `.claude/commands/scan-refactor.md`

Encodes the full refactoring workflow. When invoked, instructs the agent to:
1. Run `scanner scan $ARGUMENTS --no-open`, capture JSON output.
2. Identify the top 3 worst code smells (error severity first, then by value descending).
3. For each: extract the function, analyze it, suggest a concrete refactoring, show a before/after diff, apply it, re-scan to verify improvement.
4. Report the overall quality score delta.

**Success signal:** The overall quality score must increase. If it does not, try alternative approaches.

### 4.3 `/insights` Integration

Run `/insights` after the implementation phase is complete. Expected findings to encode:
- **"Agent added unnecessary abstractions during refactoring"** → Rule: prefer simplification over abstraction; no new classes or wrappers unless the original already uses that pattern.
- **"Agent forgot to re-scan after changes"** → Already covered by Rule 4; reinforce in `/scan-refactor` command as an explicit step.
- **"Agent modified function signatures when told not to"** → Already covered by Rule 5; add to the refactoring system prompt as well.

---

## 5. Implementation Plan

### Phase 1: Foundation (parallel)

| Task | File(s) |
|---|---|
| 1a. Add `@anthropic-ai/sdk` to `package.json` | `package.json` |
| 1b. Add `refactor` subcommand to CLI | `src/cli.js` |
| 1c. Create function extractor module | `src/extractor.js` |
| 1d. Create diff display module | `src/diff.js` |

### Phase 2: Claude Integration

| Task | File(s) | Depends on |
|---|---|---|
| 2a. Create prompt templates | `src/prompt.js` | — |
| 2b. Create Claude API client | `src/claude.js` | 1a |
| 2c. Create refactor orchestrator | `src/refactor.js` | 1b, 1c, 1d, 2a, 2b |

### Phase 3: Integration & Testing (partially parallel)

| Task | Depends on |
|---|---|
| 3a. Wire refactor into entry point | Phase 2 |
| 3b. Test on fixture files | 3a |
| 3c. Add extractor tests | 1c |
| 3d. Add diff tests | 1d |

### Phase 4: PostToolUse Hook (parallel with Phase 3)

| Task | File(s) |
|---|---|
| 4a. Create hook script | `src/hooks/postToolUse.js` |
| 4b. Create `.claude/settings.json` | `.claude/settings.json` |
| 4c. Manual test | — |

### Phase 5: Infrastructure Artifact (after Phase 3)

| Task | File(s) |
|---|---|
| 5a. Update `CLAUDE.md` with Part II rules | `CLAUDE.md` |
| 5b. Create `/scan-refactor` command | `.claude/commands/scan-refactor.md` |
| 5c. Run `/insights`, encode findings | `CLAUDE.md` |

### Phase 6: Demo Prep

| Task |
|---|
| 6a. Create "dirty" demo fixture with multiple smells |
| 6b. Dry-run the full demo flow end to end |
| 6c. Prepare fresh-session test |

---

## 6. Demo Script (10 minutes)

**Real codebase:** `ma-ds-ody-remediation-lambda` — Python AWS Lambda functions at
`/Users/akhundzr/Library/CloudStorage/OneDrive-moodys.com/Documents/GitHub/ma-ds-ody-remediation-lambda/`

**Pre-demo setup:**
- Ensure `ANTHROPIC_API_KEY` is set in the environment.
- Run a dry-run scan beforehand to confirm there are smell findings to demo.
- Have the project open in a terminal, `cd` to the JS scanner directory.
- Do NOT commit any refactoring changes to `ma-ds-ody-remediation-lambda` — use `--dry-run` or manually revert after the demo.

**0–1 min: Context — show the scanner on real code**
```bash
REPO=/Users/akhundzr/Library/CloudStorage/OneDrive-moodys.com/Documents/GitHub/ma-ds-ody-remediation-lambda
node src/index.js scan $REPO --no-open
```
Show JSON output. Point out quality score, smell findings on real Lambda functions. "This is production code, not synthetic test data."

**1–4 min: Refactoring Assistant Live**
```bash
node src/index.js refactor $REPO --top 2
```
Walk through: scanner identifies worst 2 functions from the real codebase → Claude suggests refactors → colorized diff appears in terminal → type `y` → file updated → score delta shown. Watch score climb on real code.

If a refactoring doesn't improve the score, the retry loop kicks in — point this out: "It didn't improve the score, so it tries again with a different angle."

**4–5 min: Key Decisions**
- One function at a time → cumulative score improvement is visible
- Retry loop with exit condition → the agent doesn't get stuck; gives up after 3 attempts
- Constrained Claude response format → reliable diff parsing on real code

**5–7 min: PostToolUse Hook**
Start a Claude Code session on the scanner project itself. Edit a `src/` file to introduce a smell. Hook fires:
```
⚠ Quality: 78 → 74 (-4) [C]
```
Fix it. Hook fires again:
```
✓ Quality: 74 → 78 (+4) [C]
```
"No prompting. Every file write triggers a quality check automatically."

**7–9 min: Fresh Session Test**
New terminal, new Claude Code session. Only `CLAUDE.md` and `.claude/commands/scan-refactor.md` loaded. Point the command at the real repo:
```
/scan-refactor /Users/.../ma-ds-ody-remediation-lambda
```
Agent follows the encoded workflow without any additional guidance. "It knows how to do this because the workflow is encoded — not because I explained it in this session."

**9–10 min: What You Learned**
1. Scanner-as-signal converges — the agent optimizes a number, not style preferences.
2. Retry loop matters — without an exit condition, the feedback loop can stall; 3-attempt cap keeps it moving.
3. Real code tells a better story — running on production Lambda functions is more credible than fixtures.
4. Encoding level matters — refactoring workflow = command; quality conventions = rules.

---

## Appendix A: New File Inventory

| Path | Est. Lines | Purpose |
|---|---|---|
| `src/extractor.js` | ~60 | Extract function body from file given smell finding |
| `src/claude.js` | ~80 | Claude API client wrapper |
| `src/prompt.js` | ~40 | Prompt templates |
| `src/diff.js` | ~50 | Unified diff with ANSI colors |
| `src/refactor.js` | ~120 | Refactoring orchestrator |
| `src/hooks/postToolUse.js` | ~70 | PostToolUse hook script |
| `.claude/commands/scan-refactor.md` | ~30 | Custom command spec |
| `tests/test_extractor.js` | ~50 | Extractor tests |
| `tests/test_diff.js` | ~40 | Diff tests |

**Total new code:** ~540 lines across 9 files.

## Appendix B: Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@anthropic-ai/sdk` | `^0.39.0` | Claude API client |

One new dependency. Everything else uses Node.js built-ins.

## Appendix C: Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes (refactor only) | Authentication for Claude API |

The `scan` command continues to work without any API key.
