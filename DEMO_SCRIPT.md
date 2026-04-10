# Part II Demo Script — Code Scanner: AI Refactoring & Feedback Loops

**Hackathon Presentation | 10 Minutes**
Keep this open on a second screen or print it. Commands are copy-paste ready.

---

## 1. Pre-Demo Checklist

Run through this 5 minutes before your slot.

### Environment

- [ ] Terminal font size bumped to 18pt+ (audience needs to read it from the back)
- [ ] Terminal background: dark, high contrast
- [ ] Two terminal tabs open:
  - **Tab 1**: demo commands
  - **Tab 2**: backup, in case you need to restart anything
- [ ] Browser open with one empty tab (for HTML report)

### Verify Everything Works

```bash
# Confirm the scanner runs clean
cd /Users/akhundzr/Library/CloudStorage/OneDrive-moodys.com/Documents/GitHub/claude-hackathon/javascript

node src/index.js scan ../ma-ds-ody-remediation-lambda --no-open

# Confirm refactor subcommand exists (print help only)
node src/index.js refactor --help

# Confirm the hook is configured
cat .claude/settings.json

# Pre-generate HTML report so browser is ready
node src/index.js scan ../ma-ds-ody-remediation-lambda
```

### Have Ready

- [ ] `ma-ds-ody-remediation-lambda` repo alongside the scanner
- [ ] `ANTHROPIC_API_KEY` exported in shell
- [ ] Kill stale Node servers: `kill $(ps aux | grep "node src/index" | grep -v grep | awk '{print $2}')`
- [ ] Close Slack, email, notifications

### Abort Plan

If the API is down or keys expire mid-demo:
1. Switch to the pre-generated HTML report and walk through it statically
2. Show the relevant source files (`src/refactor.js`, `src/security.js`) and explain what would have happened

---

## 2. The 10-Minute Script

### Minute 0:00–0:30 — Set the Stage

**SAY:**
> "Part I built a CLI scanner that grades a codebase on quality and security. It works, but it only tells you what's wrong — it doesn't fix anything. Part II closes the loop: the scanner now talks to Claude, proposes fixes, verifies they actually improved the score, and gives you a quality signal on every single file write. Let me show you on a real production repo."

---

### Minute 0:30–2:00 — Live Scan (Baseline)

**RUN:**
```bash
node src/index.js scan ../ma-ds-ody-remediation-lambda
```

**POINT OUT while it runs:**
- "87 files — Python Lambda functions, JavaScript .mjs files, Terraform variable files"
- ".gitignore is respected automatically — we're not scanning `node_modules` or build artifacts"
- "For files with no extension, we read the first 600 bytes — shebangs, IaC patterns, SQL headers. Three-tier detection before we ever touch an LLM"

**WHEN BROWSER OPENS, SAY:**
> "Quality score: 69, grade D. 70 code smell findings — 27 errors, 43 warnings. 65 security findings across six OWASP/CWE categories: CORS wildcards, disabled TLS, insecure HTTP, sensitive values in logs. This is a real codebase. Now let's fix it."

---

### Minute 2:00–5:00 — AI Refactoring (The Main Event)

**SAY:**
> "The `refactor` command finds the worst-scoring functions, sends each one to Claude Sonnet, shows a diff, and lets you accept or reject. If the fix doesn't improve the score, it retries up to three times with a different approach, then restores the original and moves on. Nothing is ever committed — files reset at the end of the session."

**RUN:**
```bash
node src/index.js refactor ../ma-ds-ody-remediation-lambda --top 2
```

**WHAT HAPPENS — narrate each step:**
1. Scanner identifies the 2 worst functions
2. Shows function name + smell type
3. Calls Claude → displays colorized red/green diff
4. Prompts for accept (`y`) / reject (`n`) / skip all (`s`)

**DO THIS:**
- **Accept** the first fix — point out the re-scan showing the score delta going up
- If a retry loop kicks in: "This is the interesting part — score didn't improve, so it tries a different approach. Three strikes and it restores the original."

**KEY FALLBACK:** If this section runs long, accept one function then Ctrl-C. Say:
> "Watch what happens when I interrupt it." Then show the files are back to original. "Signal handler. Files are always restored."

---

### Minute 5:00–7:00 — HTML Report (Security Fix Plan)

**SAY:**
> "Let me show you the report — it's more than a list of problems."

**IN THE BROWSER, WALK THROUGH:**

1. **Sticky nav** — click between sections to orient the audience
2. **Collapse a section** — point out the chevron toggle ("everything is collapsible")
3. **Security Fix Plan** — expand it:
   - Commit preview box: *"This is a ready-to-paste git commit message — categories, file counts, everything"*
   - Auto-fixable diffs: show the red → green `verify=False` → `verify=True` example
   - Manual review list with Issue / Risk / Fix explanations: *"Not just 'bad thing found' — it explains why it's exploitable and exactly what to change"*
4. **Projected score**: *"Apply all auto-fixes, security goes from 73 to 91. This is the number your security team wants to see."*
5. **Code smells filter** — toggle Errors / Warnings / All

---

### Minute 7:00–8:30 — PostToolUse Hook

**SAY:**
> "The report is useful on demand. But what if you never had to ask? We wired the scanner as a Claude Code hook."

**SHOW:**
```bash
cat .claude/settings.json
```

**POINT OUT** the `PostToolUse` matcher on Write and Edit.

**SAY:**
> "Every time Claude writes or edits a file, the hook fires. It scans the parent directory and prints a quality delta. Non-code files — JSON, Markdown — exit in under 5ms. Code files take maybe 50ms. You don't notice it running, but you always know if the change helped or hurt."

**SHOW the output format:**
```
✓ Quality: 72 → 78 (+6) [B]    ← improvement
⚠ Quality: 78 → 74 (-4) [C]   ← regression
```

> "This is the feedback loop without any prompting. The agent builds, the hook checks, the agent adjusts. That's scanner-as-signal — the Part I → Part II bridge."

---

### Minute 8:30–8:45 — Security Depth (Quick Hit)

**SAY:**
> "Part I caught hardcoded secrets. Part II added six OWASP/CWE categories: provider tokens — GitHub, Stripe, Slack — weak crypto like MD5 and SHA-1, TLS bypass, CORS wildcards, debug mode. Scoring is density-based, not raw count, so large repos aren't unfairly punished for having more files."

---

### Minute 8:45–10:00 — Closing: What You Learned

**SAY:**
> "Three things."

> **One: Encoding priority beats encoding instructions.** The `CLAUDE.md` rules don't say 'write clean code.' They say 'run the scanner after changes, don't let the score drop, treat the score as a gate.' You make the desired behavior the path of least resistance.

> **Two: Feedback loops compound.** The hook gives the agent a quality signal on every write. The refactor command gives it a signal on every attempt. Over a session, the model course-corrects without you manually steering it — because the environment penalizes worse code.

> **Three: Evolve the artifact, not the prompt.** We started with a scanner that prints a number. Added a fix plan. Added a retry loop. Added a hook. Each layer made the system smarter without touching the underlying scan logic. The next layer — auto-applying fixes from the report as a PR — is already plumbed in.

> "What I'd do differently: feed the previous failure reason into the retry prompt rather than just marking 'try a different approach.' And cache scan results per file hash so unchanged files don't re-scan. Those are the production gaps."

---

## 3. Key Talking Points (by Demo Moment)

**On the refactoring loop:**
> "The constraint isn't 'make Claude write code' — any LLM can do that. The constraint is 'verify it's actually better, measured by the same scanner, and roll back if it's not.' The scanner is the judge, not the human."

**On the HTML report:**
> "We're not showing a wall of lint errors. We're showing a fix plan with projected outcomes. The goal is to turn a scan result into a pull request."

**On the hook:**
> "This is the artifact that keeps working after the hackathon. Drop it into `.claude/settings.json` in any project and every file write gets a quality signal. 30 seconds to set up, changes how Claude writes code in that repo permanently."

**On security scoring:**
> "Density-based scoring was deliberate. A 500-line Lambda with 10 CORS wildcards is a different risk profile than a monorepo with 10. Raw counts punish large codebases — density normalizes for that."

---

## 4. What to Say If Something Breaks

| Failure | Recovery |
|---|---|
| **API key expired / rate limited** | "The API is rate-limiting me — let me switch to the pre-generated report." Open HTML, continue from Minute 5:00. |
| **Refactor command hangs** | "Claude is working through a 996-line function. While it thinks — here's the report." Switch to HTML, come back if it finishes. |
| **Score doesn't improve** | "This is the point. Watch the retry loop kick in." If all 3 fail: "Exit condition. Restores original — a lateral move isn't worth the risk." |
| **HTML won't serve** | Open the file directly from the filesystem — single self-contained HTML file, works without a server. |
| **Ctrl-C doesn't restore files** | `git checkout .` in the target repo. Say: "This is exactly why we never auto-commit from the refactor loop." |

---

## 5. Timing Cheat Sheet

| Segment | Start | Duration |
|---|---|---|
| Set the Stage | 0:00 | 0:30 |
| Live Scan | 0:30 | 1:30 |
| AI Refactoring | 2:00 | 3:00 |
| HTML Report | 5:00 | 2:00 |
| PostToolUse Hook | 7:00 | 1:30 |
| Security Depth | 8:30 | 0:15 |
| Closing | 8:45 | 1:15 |

**Running long?** Cut the security depth section (lowest impact). Still over? One refactor function instead of two.

**Running short?** Expand the "what I'd do differently" section: failure-reason retry prompts, per-file-hash caching for the hook, auto-apply security fixes as a PR.

---

*Test every command in the checklist the morning of the demo.*
