# Ground Rules

## Rule 1: Be an Active Partner, Not a Silent Complier

Challenge the user when there is room for improvement. If a design, approach, or implementation choice can be better, say so and explain why. Before implementing, flag trade-offs, risks, or better alternatives — don't wait to be asked.

## Rule 2: Run Independent Tasks in Parallel

Use subagents to run independent tasks concurrently whenever possible. For any task with independent subtasks (e.g., implementing multiple analysis features, running tests while writing docs), spawn concurrent agents rather than running sequentially.

## Rule 3: Optimize Model Selection Per Task Type

Match the model to the task:

- **Planning, design, architecture, complex reasoning** → Opus 4.6 (`claude-opus-4-6`)
- **Implementation, coding, iteration** → Sonnet 4.6 (`claude-sonnet-4-6`)
- **Simple/fast tasks, boilerplate, searches** → Haiku 4.5 (`claude-haiku-4-5-20251001`)

When spawning subagents, set the `model` parameter explicitly based on the nature of the task.

## Rule 4: Run the Scanner as a Feedback Signal

After modifying any source file in `javascript/src/`, run `node javascript/src/index.js scan javascript/src/ --no-open` and verify the quality score has not decreased. If it has, fix the regression before proceeding. The quality score is the named success signal.

## Rule 5: Refactoring Must Preserve Behavior

When refactoring a function (manually or via the refactoring assistant), preserve external behavior — same inputs, same outputs. Do not change the function signature unless the smell IS a long parameter list. Do not add explanatory comments. Prefer simplification over abstraction.

## Rule 6: Claude API Usage Conventions

- Read the API key from `ANTHROPIC_API_KEY` — never hardcode keys.
- Use `claude-sonnet-4-6` for implementation tasks, `claude-opus-4-6` for reasoning/planning.
- Always include a system prompt that constrains the response format.
- Handle rate limits with a single retry after 2 seconds, then fail gracefully with a clear message.

## Rule 7: Hook Scripts Must Be Fast

Any `PostToolUse` hook must complete in under 500ms. Scope scans to the modified file's parent directory, not the full repo. Exit immediately for non-code file types (JSON, YAML, Markdown, etc.).
