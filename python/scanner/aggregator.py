import os
from datetime import datetime, timezone
from . import quality as quality_module


def aggregate(
    directory: str,
    file_results: list[dict],
    smell_findings: list[dict],
    security_findings: list[dict],
    skipped: int,
    duration_ms: int,
) -> dict:
    total_loc = sum(f['loc'] for f in file_results)
    total_comment = sum(f['comment_lines'] for f in file_results)
    total_blank = sum(f['blank_lines'] for f in file_results)
    total_functions = sum(f['functions'] for f in file_results)
    total_classes = sum(f['classes'] for f in file_results)

    # Per-language breakdown
    languages: dict[str, dict] = {}
    for f in file_results:
        lang = f['language']
        if lang not in languages:
            languages[lang] = {'files': 0, 'loc': 0, 'comment_lines': 0,
                               'blank_lines': 0, 'functions': 0, 'classes': 0}
        lg = languages[lang]
        lg['files'] += 1
        lg['loc'] += f['loc']
        lg['comment_lines'] += f['comment_lines']
        lg['blank_lines'] += f['blank_lines']
        lg['functions'] += f['functions']
        lg['classes'] += f['classes']

    # Use total_loc as proxy for total_function_lines
    smell_warnings = sum(1 for s in smell_findings if s['severity'] == 'warning')
    smell_errors   = sum(1 for s in smell_findings if s['severity'] == 'error')
    secret_count   = sum(1 for s in security_findings if s['type'] == 'hardcoded_secret')
    danger_count   = sum(1 for s in security_findings if s['type'] == 'dangerous_call')

    quality = quality_module.compute(
        total_loc=total_loc,
        total_comment_lines=total_comment,
        total_functions=total_functions,
        total_function_lines=total_loc,  # approximation
        total_files=len(file_results),
        smell_warnings=smell_warnings,
        smell_errors=smell_errors,
        secret_count=secret_count,
        dangerous_call_count=danger_count,
    )

    # Normalize file paths to be relative to scanned directory
    files_out = []
    for f in file_results:
        try:
            rel = os.path.relpath(f['path'], directory)
        except ValueError:
            rel = f['path']
        files_out.append({
            'path': rel,
            'language': f['language'],
            'loc': f['loc'],
            'comment_lines': f['comment_lines'],
            'blank_lines': f['blank_lines'],
            'functions': f['functions'],
            'classes': f['classes'],
            'smells': f.get('smells', 0),
            'security_issues': f.get('security_issues', 0),
        })

    # Normalize paths in findings too
    for finding in smell_findings + security_findings:
        try:
            finding['file'] = os.path.relpath(finding['file'], directory)
        except ValueError:
            pass

    return {
        'scan_metadata': {
            'directory': directory,
            'timestamp': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'total_files_scanned': len(file_results),
            'skipped_files': skipped,
            'scan_duration_ms': duration_ms,
        },
        'summary': {
            'total_loc': total_loc,
            'total_comment_lines': total_comment,
            'total_blank_lines': total_blank,
            'total_files': len(file_results),
            'total_functions': total_functions,
            'total_classes': total_classes,
            'languages': languages,
        },
        'quality': quality,
        'code_smells': {
            'total_warnings': smell_warnings,
            'total_errors': smell_errors,
            'findings': smell_findings,
        },
        'security': {
            'total_findings': len(security_findings),
            'findings': security_findings,
        },
        'files': files_out,
    }
