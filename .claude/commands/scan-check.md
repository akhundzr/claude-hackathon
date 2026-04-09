Run the scanner against the test fixtures and validate the JSON output.

1. Run: `cd python && python -m scanner scan ../python/tests/fixtures/ --no-open 2>/dev/null`
2. Verify the JSON output contains all required top-level keys: `scan_metadata`, `summary`, `quality`, `code_smells`, `security`, `files`
3. Confirm at least one smell finding is present in `code_smells.findings`
4. Confirm at least one security finding is present in `security.findings`
5. Report PASS or FAIL with a one-line summary of what was found
