# Hackathon Part I: Build Your Code Scanner

**Focus:** DPI workflow + Active Partner + Check Alignment + Encoding Priority
**Goal:** Build a working code scanner CLI from scratch — using DPI to ship fast and ground rules to make your agent effective

---

## What You're Building

A CLI code scanner that analyzes any codebase and reports on its quality. You choose the language and tech stack. The agent does the heavy lifting. You steer, verify, and encode.

The scope is intentionally ambitious — the solution is DPI, not working harder. Design before building. Plan before implementing. Let the agent iterate while you steer.

### Core Requirements

Your scanner should:

- Accept a directory path via CLI
- Recursively traverse files (with sensible ignore patterns)
- Detect languages by file type
- Extract basic metrics: lines of code, comments, blanks, file counts
- Count functions and classes
- Include 2–3 analysis features picked from the **Analysis Feature Menu** below
- Output structured JSON results
- Generate one human-readable report (HTML, Markdown, or CSV)

You'll also create a ground rules file (`CLAUDE.md` or `.cursor/rules/`) with at least 2–3 meaningful rules from the build.

### Analysis Feature Menu

Pick 2–3 for your core requirements. Come back for more as bonus work.

| Feature | Complexity | What it does |
|---|---|---|
| Cyclomatic complexity | Medium | Flag functions with complexity above a threshold |
| Code duplication | Medium | Find duplicate or near-duplicate blocks, report percentage |
| Code smell detection | Medium | Long functions, deep nesting, long parameter lists |
| Security scanning | Medium | Hardcoded secrets, dangerous function calls |
| Documentation coverage | Medium | Ratio of documented vs. undocumented public functions |
| Quality scoring | Medium–High | 0–100 composite score with letter grade |
| Dependency analysis | High | Map imports, detect circular dependencies |

### Bonus Requirements *(pick at least one for DoD)*

Stretch goals of increasing ambition. Pick what interests you.

- [ ] Quality scoring system (0–100, letter grade) — if not already in your core picks
- [ ] Data visualizations (charts/graphs in an HTML report)
- [ ] Unit tests for critical scanner paths
- [ ] `DESIGN.md` documenting your architecture decisions
- [ ] Model strategy applied (strongest model for planning, fastest for implementation)
- [ ] Parallel implementations via worktrees — compare two approaches side-by-side
- [ ] Custom command encoding a reusable workflow from the build
- [ ] Created or extended a Skill that helps with the build

---

## Definition of Done

**Core (required):**
- [ ] Functional scanner that clears the **Core Requirements**
- [ ] At least one **Bonus Requirement** of your choice
- [ ] **Ground Rules** file with at least 2–3 meaningful rules

**Stretch:** Keep going. Pick more from the bonus menu — quality scoring, visualizations, tests, parallel implementations, skills, model strategy. The more you attempt, the more you practice.

---

## Tips

- **Commit early, commit often.** After each working milestone. You built a commit formatter in KYT 4 — use it.
- **Recall:** `/rewind` lets you roll back to any previous prompt if you need to recover.
- **Model strategy:** Consider your strongest model for design and planning, a faster model for implementation.

---

## Your Approach

Use the DPI workflow: design the interface first, plan the build phases, then implement. Practice Active Partner — challenge the agent's proposals, check alignment before it builds, and encode what you learn as you go.

### Phase 1: Bootstrap Your Scanner (~15 min)

Get a basic scanner working: CLI input, directory traversal, file counting, JSON output.

Start with the DPI workflow: sketch what the CLI interface looks like, what the JSON output structure should be, and what's in scope for this phase. Even 2 minutes of design saves 20 minutes of re-prompting.

<details>
<summary><strong>Rescue scaffold: starter prompt</strong></summary>

If you're struggling to get started after a few minutes:

```
Create a [Python/Node/Go] code scanner with:
- CLI that accepts a directory path
- Recursive file traversal (skip .git, node_modules, __pycache__)
- Count files by extension and total lines of code
- Output JSON summary
- Handle errors gracefully
```

But the goal is to practice designing and prompting yourself — use this as a fallback, not a starting point.

</details>

**Reflect before moving on:**
- Did the agent ask clarifying questions, or did it just build? (Compliance Bias check)
- What prompts worked well? What did you have to clarify or retry?

**Commit your work.**

### Phase 2: Add Analysis Features (~45 min)

Pick 2–3 features from the analysis feature menu. For each one, consider: do you want to prompt directly, or use the DPI approach — describe what you want, ask the agent to propose an approach with trade-offs, then choose?

**Alignment check:** Before the agent writes code, ask "Tell me what you're going to build" to catch misunderstandings early. This is Check Alignment — one sentence that prevents 50 lines of wrong code.

**Reflect before moving on:**
- Which features integrated smoothly vs. required iteration?
- Did you need to provide more context for certain features?
- Did you hit a point where the agent needed a fresh session? (Context Rot signal)
- Have you noticed any corrections you've made more than once? Write them down now — that's encoding.

**Commit your work.**

### Phase 3: Generate Reports (~30 min)

Add human-readable output: an HTML dashboard, Markdown summary, or CSV export. If you picked quality scoring, surface it prominently here.

**Reflect before moving on:**
- How did the agent handle UI/visualization generation?
- What manual adjustments were needed?

**Commit your work.**

### Phase 4: Encode What You've Learned (~remaining time)

Review your build experience. What corrections did you make more than once? What conventions did the agent keep getting wrong? Encode these as ground rules.

This is the **encode as you go** discipline: if you've told the agent something twice, write it down so you never have to say it again. Phase 4 is your formalization step, but ideally you've been capturing rules throughout.

**Two approaches:**

1. **Your observations.** Look for corrections you've made more than once — that's the heuristic. Common examples: "Always use TypeScript strict mode," "Run the scanner on test fixtures after each change," "Prefer streaming over loading entire files into memory."

2. **The retro move.** Ask the agent to review the session and suggest rules based on friction it observed:

```
Review our conversation. What ground rules would have
prevented our correction cycles? Suggest 2–3 rules I should
save to [CLAUDE.md / .cursor/rules/].
```

**Commit your work.**

---

## Patterns to Practice

**Design Document** *(from DPI)*
Before prompting for implementation, sketch the interface: what does the CLI accept, what does the JSON output look like, what features are in scope? Even a 2-minute `DESIGN.md` saves 20 minutes of re-prompting.

**Active Partner** *(from DPI)*
The agent defaults to silent compliance. Push back: "What are the trade-offs?" "What would you do differently?" "Push back if something seems wrong."

**Check Alignment** *(from DPI)*
Before the agent writes code, ask "Tell me what you're going to build." This catches misunderstandings early — before they become 50 lines of wrong code.

**Encoding Priority**
As you work, notice what you're repeating. A correction you've made twice should become a rule. Encode as you go — don't save it all for Phase 4.

---

## Obstacles to Watch

**Compliance Bias** — The agent says "Sure thing!" even when confused. If it agrees instantly without asking questions, that's a signal. Force alignment: "Tell me what you're going to build before you build it."

**Context Rot** — After many exchanges, the agent loses track of earlier decisions. Watch for contradictions or repeated mistakes. When you see it: start a fresh session with a summary of where you are.

**Silent Misalignment** — The agent builds confidently in the wrong direction. Confidence does not equal correctness. Run the scanner on real code frequently — real output catches misalignment faster than reading generated code.

---

## If You're Stuck

<details>
<summary><strong>10 minutes in, nothing working?</strong></summary>

Tell the agent what you need in plain language:

```
I'm trying to build a code scanner in [LANGUAGE].
I need it to: traverse directories, count lines, detect file types.
Generate a complete working starter with CLI interface.
Keep it simple — I'll enhance it later.
```

</details>

<details>
<summary><strong>Analysis feature not integrating?</strong></summary>

Give the agent your current state:

```
I have a scanner that outputs JSON. I want to add [FEATURE].
Here's my current JSON output: [PASTE]
Generate code that adds [FEATURE] data to this structure.
```

</details>

<details>
<summary><strong>Report generation broken?</strong></summary>

Try a self-contained approach:

```
Generate a standalone HTML file that:
- Reads my scanner's JSON output
- Displays a dashboard with [METRICS]
- Uses CDN libraries for visualizations
- Looks professional
Complete single-file solution.
```

</details>

<details>
<summary><strong>Don't know what rules to write?</strong></summary>

**The heuristic:** Look for corrections you've made more than once. If you've told the agent the same thing twice, that's a rule waiting to be written.

**The retro move:** Ask the agent to review its own struggles:

```
Review our conversation. What ground rules would have
prevented our correction cycles? Suggest 2–3 rules I should
save to [CLAUDE.md / .cursor/rules/].
```

**Common examples:**
- "Always use TypeScript strict mode" (if you kept correcting type issues)
- "Run the scanner on test fixtures after each change" (if you kept forgetting to test)
- "Prefer streaming JSON output over loading entire files into memory" (if the agent kept making this mistake)

</details>

---

## Track What Works (and What Doesn't)

Keep a mental or written log as you build:

| Worked Well | Needed Iteration | Failed/Abandoned |
|---|---|---|
| e.g., "File traversal prompt worked first try" | e.g., "Complexity calc needed 3 attempts" | e.g., "Gave up on X, did Y instead" |

**Notice the patterns:**
- When did DPI (designing before implementing) save time?
- When did a fresh session beat continuing a long one?
- When did checking alignment catch a misunderstanding early?
- What did you encode as a rule? What should you have encoded earlier?

---

## Part I Checkpoint

Before moving to Part II, you should have:

- **Core scanner working** — traverses a codebase and extracts metrics
- **Analysis features** — at least 2–3 from the menu
- **Reports** — JSON + one human-readable format
- **Ground rules** — at least 2–3 meaningful rules in your ground rules file
- **At least one bonus** — one stretch requirement of your choice

**Don't have all of this?** That's OK. Move to Part II anyway and build something creative with what you have.

**Before Part II, ensure you have:**
- A clean git commit of your working Part I code
- Your scanner's JSON output format documented or understood
- Notes on what prompts and workflows worked well

**Context tip:** Part II is a good time for a fresh agent session. Summarize your Part I scanner in 2–3 sentences rather than pasting everything.

---

*This exercise is Part I of the Hackathon.*
