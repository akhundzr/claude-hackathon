import argparse
import os
import sys


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog='scanner',
        description='Code Scanner — instant codebase health assessment',
    )
    sub = parser.add_subparsers(dest='command', required=True)

    scan = sub.add_parser('scan', help='Scan a directory')
    scan.add_argument('directory', help='Directory to scan (relative or absolute)')
    scan.add_argument('--output', default='./report.html',
                      help='Output path for HTML report (default: ./report.html)')
    scan.add_argument('--no-open', dest='no_open', action='store_true',
                      help='Suppress automatic browser opening')

    args = parser.parse_args()

    if not os.path.isdir(args.directory):
        print(f"Error: '{args.directory}' is not a valid directory", file=sys.stderr)
        sys.exit(1)

    return args
