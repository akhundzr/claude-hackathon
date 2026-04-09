import json
import sys


def output(report: dict, filepath: str | None = None) -> None:
    text = json.dumps(report, indent=2)
    print(text)
    if filepath:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
