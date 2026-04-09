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
