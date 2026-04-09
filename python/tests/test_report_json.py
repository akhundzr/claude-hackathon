import json
import pytest
from scanner.aggregator import aggregate
from scanner.report_json import output


REQUIRED_KEYS = ('scan_metadata', 'summary', 'quality', 'code_smells', 'security', 'files')


def test_valid_json_output(capsys):
    report = aggregate('/d', [], [], [], 0, 10)
    output(report)
    captured = capsys.readouterr()
    parsed = json.loads(captured.out)
    assert isinstance(parsed, dict)


def test_schema_keys(capsys):
    report = aggregate('/d', [], [], [], 0, 10)
    output(report)
    captured = capsys.readouterr()
    parsed = json.loads(captured.out)
    for key in REQUIRED_KEYS:
        assert key in parsed, f"Missing key: {key}"


def test_report_structure():
    report = aggregate('/d', [], [], [], 0, 10)
    for key in REQUIRED_KEYS:
        assert key in report


def test_quality_sub_keys():
    report = aggregate('/d', [], [], [], 0, 10)
    assert 'score' in report['quality']
    assert 'grade' in report['quality']
    assert 'components' in report['quality']


def test_metadata_fields():
    report = aggregate('/mydir', [], [], [], 3, 456)
    meta = report['scan_metadata']
    assert meta['directory'] == '/mydir'
    assert meta['skipped_files'] == 3
    assert meta['scan_duration_ms'] == 456
    assert 'timestamp' in meta
    assert 'total_files_scanned' in meta
