# /scan-refactor

AI-powered refactoring workflow: scan a directory for code smells, fix the worst ones with Claude, and verify quality improved.

## Usage

```
/scan-refactor <directory>
```

If no directory is given, use the current working directory.

## Steps

1. Run the scanner: `node javascript/src/index.js scan $ARGUMENTS --no-open`
   Capture the JSON output. Note the quality score, grade, and smell findings.

2. Identify the top 3 worst code smell findings:
   - Sort by severity (error first, then warning)
   - Within the same severity, sort by value descending (worst offenders first)

3. For each of the top 3 findings:
   a. Read the file and extract the offending function body.
   b. Analyze the specific smell: long function, deep nesting, or long parameter list.
   c. Propose a concrete refactoring that addresses the smell.
   d. Show a before/after comparison.
   e. Apply the refactoring.
   f. Re-run the scanner: `node javascript/src/index.js scan $ARGUMENTS --no-open`
   g. Confirm the quality score improved. If it did not improve, try a different approach (up to 2 retries), then move on.

4. After all refactorings, run a final scan and report:
   - Overall quality score: before → after (delta)
   - Grade: before → after
   - Which functions were successfully improved

## Success signal

The overall quality score must increase. If a specific function's refactoring does not improve the score after 3 attempts, restore the original and move on — do not get stuck.

## Constraints

- Do not change a function's external behavior (same inputs, same outputs)
- Do not change the function signature unless the issue IS a long parameter list
- Do not add explanatory comments — the refactored code should be self-evident
- Prefer simplification over abstraction — extract helpers only if it reduces complexity, not to add layers
