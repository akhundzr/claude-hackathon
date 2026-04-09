# Hackathon Part II: Enhance and Package

**Focus:** Feedback Loop + Encoding Priority + Evolve Loop
**Goal:** Extend your scanner with a creative feature, establish a feedback loop, and package what you've learned as a reusable artifact

---

## What You're Building

You have a working scanner from Part I. Now build a system around it.

In "From Build to System" you learned three concepts — the **Feedback Loop**, **Encoding Priority**, and the **Evolve Loop**. Part II is where you apply all three. Part I patterns still apply: Design Document, Active Partner, Check Alignment, encode as you go.

Start fresh — a new agent session with a 2–3 sentence summary of your Part I scanner. That beats carrying forward a long conversation. Commit before you begin. Your Part I code is your safety net.

### Core Requirements

- A creative extension of your scanner — pick one direction from the **Creative Paths** below
- A **Feedback Loop** with a named success signal — the agent iterates against it, you watch the signal
- An **Infrastructure Artifact** packaged for reuse — ground rules minimum, skill ideal (see **Graduated Tiers**)
- Artifact tested in a **Fresh Session** — does the agent behave better with it loaded?
- A **10-minute demo** covering what you built, how you built it, what you packaged, what you learned

If you already tackled bonus items in Part I (custom command, skill, parallel implementations), you're ahead — extend that work or try something new.

### Bonus Requirements *(pick any)*

- [ ] Standard or stretch tier packaging (command, skill, or distributable skill with `scripts/`)
- [ ] `/insights` run — at least one finding encoded as a rule or skill improvement
- [ ] Hook-based feedback loop (automated, no prompting needed)
- [ ] Multiple encoding levels applied (rules + command + skill)
- [ ] Fresh-session test demonstrated live in demo

---

## Definition of Done

**Core (required):**
- [ ] Functional **Creative Extension** of your scanner
- [ ] **Feedback Loop** established with a named success signal
- [ ] **Infrastructure Artifact** packaged (minimum tier: ground rules)
- [ ] Artifact tested in a **Fresh Session**
- [ ] **Demo-ready** — can show working features on real code (10-minute format)

**Stretch:** Keep going with the bonus menu — distributable skills, `/insights`, hooks, multiple encoding levels.

---

## The Challenge

Build something innovative. Establish a feedback loop. Package an artifact. Demo all three.

| Section | Duration | Focus |
|---|---|---|
| **What you built** | 3 min | Live demo of working features on real code |
| **How you built it** | 2 min | Key workflows, decisions, what broke |
| **What you packaged** | 3 min | Infrastructure artifact — show it working in a fresh session |
| **What you learned** | 2 min | Encoding priority, feedback loops, the Evolve Loop |

**Total: 10 minutes.** Work backward from this.

---

## Creative Paths

Go your own direction, or pick one of the paths below for inspiration. Be creative, have fun with it — this is an opportunity for a fun and exciting demo. The most memorable demos aren't necessarily the most technically complex; they're the ones with a point of view. Don't just build features. Build something only you would build.

Start with a design phase: brainstorm with your agent, sketch a `DESIGN.md`, then implement. **Other directions to consider:** test generation copilot, architecture documentation generator, CI/CD pipeline analyzer, git history visualization engine, code style harmonizer — or anything else you can dream up and demo.

---

### Path A: AI-Powered Refactoring Assistant

**The pitch:** Scanner finds complex code, AI suggests how to fix it.

**Core loop:** Scanner detects high-complexity function → agent suggests refactoring → show before/after diff → user accepts or rejects → re-scan to verify improvement.

**Demo hook:** "Watch as the agent refactors this messy function in real-time, then re-scans to prove it's cleaner."

---

### Path B: Interactive Code Explorer

**The pitch:** Chat with your codebase like it's a conversation.

**Core features:** Natural language queries ("Which files are most complex?"), visual exploration (dependency graphs, complexity heatmaps), code explanations (click any function, agent explains it).

**Demo hook:** "Ask my codebase anything in plain English."

---

### Path C: Predictive Technical Debt Monitor

**The pitch:** Predict which files will cause bugs before they happen.

**Core analysis:** Scan metrics + git history (commit frequency, authors, churn) → risk formula → "risk report" highlighting danger zones.

**Demo hook:** "Here are the 5 files most likely to cause your next outage."

---

### Path D: Skill Creator

**The pitch:** Identify a gap in the agent's capabilities from your build. Create a skill that fills it. Have a partner test it. Does it actually improve agent behavior?

**Demo hook:** "I built a skill that makes the agent better at [X]. Watch — my partner's agent can now do this without guidance."

**Skill docs:** [agentskills.io](https://agentskills.io/) | [Claude Code skills](https://code.claude.com/docs/en/skills)

---

### Path E: Automation Pipeline

**The pitch:** Create an automation that runs when a specific event triggers — no human intervention needed. Hooks are an advanced feature — this path gives you an early taste.

**Core loop:** Identify a repetitive workflow from Part I → encode it as a hook, script, or CI step → watch it run autonomously.

**Demo hook:** "Every time I save a file, the agent automatically scans it and tells me if I've made the code worse."

---

### Path F: Multi-Agent Orchestration

**The pitch:** Set up parallel agents to handle independent tasks from your build's TODO list.

**Core loop:** Break enhancement into independent tasks → run separate agent sessions (background agents in Cursor, `--worktree` in Claude Code) → merge results → compare.

**Demo hook:** "I ran three agents in parallel, each adding a different feature. Here's how they merged."

---

### Path G: MCP Integration

**The pitch:** Turn part of your build into an MCP server or connect an external data source via MCP. This path is for participants who are ready for MCP — it gets full treatment in a follow-on session.

**Demo hook:** "My scanner is now an MCP server — any agent can connect to it and get code quality data."

**MCP docs:** [What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro) | [Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server)

---

## Establish a Feedback Loop

A **Feedback Loop** gives the agent a clear success signal to iterate against. Without one, you're reviewing every diff by hand. With one, the agent builds, checks its own work, and keeps refining.

**The pattern:**
1. Pick a success signal — tests, linter, type checker, your scanner output
2. Tell the agent to iterate against it
3. Watch the signal, not the code

| Signal | Example |
|---|---|
| Tests | "Run `npm test`. Fix failures and re-run until green." |
| Linter | "Run `eslint .` after each change. Fix issues before moving on." |
| Type checker | "Run `tsc --noEmit`. Resolve all type errors." |
| Scanner output | "Run the scanner on `src/`. Fix any function with complexity > 15 and re-scan to confirm." |

### Scanner-as-signal (the meta-move)

Your code scanner IS a feedback signal. Point the agent at your own scanner output and let it iterate. That's a Feedback Loop using infrastructure you built — the Part I → Part II bridge made real.

### Stretch: Hook-based automation

Encode the feedback loop as a hook so it runs automatically — no prompting needed. A `PostToolUse` hook that runs the scanner or linter after every file edit gives you continuous quality feedback without manual intervention. See Path F if this interests you.

### When to stop

Feedback loops need an exit condition. If the agent has attempted the same fix three times without progress, reset the approach — fresh context, different angle — rather than prompting harder. A partial result worth polishing beats unlimited retries that never converge.

---

## Package Your Infrastructure

After building your creative extension, extract the most valuable part of your build process as a reusable artifact. This is the Evolve Loop's Encode step.

### Graduated Tiers

| Tier | Artifact | Example |
|---|---|---|
| **Minimum** | Ground rules file specific to your project | "Always use TypeScript strict mode. Run tests before committing." |
| **Standard** | A reusable command or pure `SKILL.md` encoding a workflow from the build | A `/scan-report` command that generates an HTML report or dashboard from JSON scanner output |
| **Stretch** | A distributable skill with `scripts/` — standalone, works in any project | A code quality skill with entry point script + `SKILL.md` instructions |

A distributable skill means someone else can copy your skill directory into their `.claude/skills/` or `.cursor/skills/` and it works with no other setup. The `SKILL.md` describes when it activates; the scripts do the heavy lifting.

### How to Package

**Claude Code:**
- Ground rules → `CLAUDE.md` or `AGENTS.md`
- Commands → `.claude/commands/your-command.md`
- Skills → `.claude/skills/your-skill/SKILL.md` (+ optional `scripts/`)

**Cursor:**
- Ground rules → `.cursor/rules/your-rules.mdc`
- Skills → `.cursor/skills/your-skill/SKILL.md` (+ optional `scripts/`)

**Skill docs:** [agentskills.io](https://agentskills.io/) (open standard) | [Claude Code skills](https://code.claude.com/docs/en/skills) (Claude-specific features)

### The Fresh-Session Test

The strongest demo of a packaged artifact: **start a fresh agent session with only the artifact loaded.** Does the agent behave better?

This is the Evolve Loop's Verify step made visible. Start fresh, load the artifact, attempt a task that previously required manual guidance. If the agent handles it independently, the encoding worked.

---

## Patterns to Practice

**Evolve Loop** *(core for Part II)*
Detect a gap → Trace the cause → Encode the fix → Verify in a fresh session. The packaging step is the explicit Encode + Verify. **Claude Code users:** run `/insights` to automate the Detect step — it analyzes patterns across your sessions, surfacing recurring corrections you might have missed. Find one pattern. Encode the fix.

**Encoding Priority** *(core for Part II)*
What level of encoding does this learning deserve?
- Something you'd tell the agent every session → **rule**
- A multi-step workflow you'd invoke occasionally → **command**
- Deep expertise that should activate automatically → **skill**
- Non-negotiable enforcement with zero context cost → **hook**

---

## Obstacles to Watch

**Context Rot** — By Part II, you've been coding for hours. Long sessions degrade — the agent starts contradicting earlier decisions, forgetting constraints, repeating mistakes. When you notice this, start fresh. A 2-sentence summary of where you are beats a degraded context window.

**Sunk Cost** — "I've spent 45 minutes on this path and it's not working, but I can't abandon it now." Yes you can. A small working feature with a strong fresh-session test is a better demo than a half-finished ambitious project. The hackathon rewards pivoting, not persistence.

---

## If You're Stuck

<details>
<summary><strong>Can't decide on a path?</strong></summary>

Pick Path A (Refactoring Assistant) — it's the most straightforward extension of your scanner.

</details>

<details>
<summary><strong>Path not coming together?</strong></summary>

Tell the agent where you are and what's broken. Ask for a simpler approach you can demo in the remaining time. A small thing that works beats a big thing that doesn't.

</details>

<details>
<summary><strong>Don't know what to package?</strong></summary>

Ask the agent to review the session — what corrections came up repeatedly? Those are encodings waiting to happen. Then decide: is each one a rule, a command, or a skill?

</details>

<details>
<summary><strong>Feedback loop not working?</strong></summary>

Start simple. Pick ONE signal: "After each code change, run my scanner on `src/`. Fix any function with complexity > 15. Re-scan. Keep going until all functions are under 15." That's a feedback loop.

</details>

---

## Track What Works

| Worked Well | Needed Iteration | Failed/Abandoned |
|---|---|---|
| e.g., "Full stack in one prompt — agent got it" | e.g., "Complexity refactoring needed 3 tries" | e.g., "Gave up on Path C, pivoted to A" |

**Notice the patterns:**
- When did the Feedback Loop save you from reviewing every diff?
- When did fresh context beat continuing?
- What did you encode that you wished you'd encoded earlier?
- Did the fresh-session test surprise you?

---

## Demo Tips

- Show working code and real outputs — not slides
- Run your scanner on a real codebase — your own project, a team repo, or a well-known open-source project. Real output on real code is more compelling than synthetic test data
- The process story (which patterns you applied, what surprised you, key pivots) is often more interesting to the audience than a feature tour
- Share failures and pivots — they're more valuable than polished demos
- The fresh-session test is the strongest possible demo
- Don't apologize for what's not done. Working software + honest reflection is the goal

---

## Discussion Prompts (for retro)

After demos, the group discusses:

- What did you encode that you'll actually keep using after today?
- What would you encode differently now that you've tried it?
- Where did encoding priority (rule vs. command vs. skill) matter?
- Did anyone's artifact surprise them — did the agent use it in ways you didn't expect?
- When did a fresh session beat continuing a long one? What was the signal?
- Where did the Feedback Loop catch something you would have missed?

---

## Awards

| Award | Criteria |
|---|---|
| **Best System** | Most effective combination of build + infrastructure artifact |
| **Best Evolve Moment** | Clearest example of "I hit a wall, traced the cause, encoded the fix" |
| **Most Creative Path** | Most unexpected, personal, or inventive — the demo only you would build |
| **Best Fresh-Session Demo** | Artifact that most visibly improved agent behavior in a clean session |
