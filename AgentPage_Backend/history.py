import json
import uuid
from datetime import datetime
from pathlib import Path

HISTORY_FILE = Path("history.json")

# def load_history():
#     if not HISTORY_FILE.exists():
#         return []
#     with open(HISTORY_FILE, "r") as f:
#         return json.load(f)
def load_history():
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def save_history(data):
    with open(HISTORY_FILE, "w") as f:
        json.dump(data, f, indent=2)

def add_history_record(record):
    history = load_history()
    history.append(record)
    save_history(history)

def get_all_history():
    return load_history()