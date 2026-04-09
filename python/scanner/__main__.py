import os
import sys
import time
import webbrowser

from .cli import parse_args
from .traversal import walk
from .language import detect as detect_language
from .metrics import analyze_file
from .smells import detect as detect_smells
from .security import scan as scan_security
from .aggregator import aggregate
from .report_json import output as output_json
from .report_html import generate as generate_html


def main() -> None:
    args = parse_args()
    directories = [os.path.abspath(d) for d in args.directories]
    directory = os.path.commonpath(directories) if len(directories) > 1 else directories[0]

    start = time.time()
    file_results: list[dict] = []
    smell_findings: list[dict] = []
    security_findings: list[dict] = []
    skipped = 0

    for d in directories:
        dir_paths, dir_skipped = walk(d)
        skipped += dir_skipped

        for filepath in dir_paths:
            language = detect_language(filepath)
            metrics = analyze_file(filepath, language)
            if metrics is None:
                skipped += 1
                continue

            smells = detect_smells(filepath, language)
            security = scan_security(filepath, language)

            smell_findings.extend(smells)
            security_findings.extend(security)

            file_results.append({
                **metrics,
                'smells': len(smells),
                'security_issues': len(security),
            })

    duration_ms = int((time.time() - start) * 1000)

    report = aggregate(
        directory=directory,
        file_results=file_results,
        smell_findings=smell_findings,
        security_findings=security_findings,
        skipped=skipped,
        duration_ms=duration_ms,
    )

    output_json(report)

    html = generate_html(report)
    output_path = os.path.abspath(args.output)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    if not args.no_open:
        webbrowser.open(f'file://{output_path}')


if __name__ == '__main__':
    main()
