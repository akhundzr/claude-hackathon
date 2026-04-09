import sys
import os

# Add python/ to sys.path so tests can import `from scanner.xxx import yyy`
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
