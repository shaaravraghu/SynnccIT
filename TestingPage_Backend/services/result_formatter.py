"""
Unified Result Formatter:
- Formats sandbox execution results
- Normalizes output for Python & JavaScript
- Performs static error extraction
- Generates human-friendly explanations
"""

from typing import Any, Dict, List, Optional
import re


def format_simulation_output(
    stdout: str = "",
    stderr: str = "",
    runtime_ms: float = 0,
    memory_mb: Optional[float] = None,
    trace: Optional[List[Dict[str, Any]]] = None,
    errors_summary: str = "",
    human_friendly: str = "",
) -> Dict[str, Any]:

    trace = trace or []
    runtime_str = _human_time(runtime_ms)
    memory_str = _human_memory(memory_mb) if memory_mb is not None else "N/A"

    detected_error = _detect_error(stderr)

    simulation = {
        "output": stdout,
        "stderr": stderr,
        "runtime": runtime_str,
        "memory": memory_str,
        "trace": trace,
    }

    errors = {
        "summary": errors_summary or detected_error.get("summary"),
        "human_friendly_explanation": human_friendly or detected_error.get("friendly"),
        "error_type": detected_error.get("type"),
        "line": detected_error.get("line"),
        "column": detected_error.get("column"),
    }

    return {
        "simulation": simulation,
        "errors": errors,
    }


# -------------------------------------------------------------------------
# Testcase Formatter (used by evaluation router)
# -------------------------------------------------------------------------

def format_testcase_result(testcase: Dict[str, Any]) -> Dict[str, Any]:
    """
    Wrap a single testcase result into the unified simulation schema.
    """

    return {
        "testcase_id": testcase.get("testcase_id"),
        "input": testcase.get("input"),
        "expected_output": testcase.get("expected_output"),
        "actual_output": testcase.get("actual_output"),
        "status": testcase.get("status"),
        "simulation": {
            "runtime": f"{testcase.get('execution_time_ms', 0)}ms",
            "memory": f"{testcase.get('memory_used_kb', 0)}KB",
        },
        "errors": {
            "summary": None,
            "human_friendly_explanation": None,
            "error_type": None,
            "line": None,
            "column": None,
        },
    }


# -------------------------------------------------------------------------
# Static Error Detection
# -------------------------------------------------------------------------

def _detect_error(stderr: str) -> Dict[str, Any]:

    if not stderr:
        return {
            "summary": "",
            "friendly": "",
            "type": None,
            "line": None,
            "column": None
        }

    # --- PYTHON -------------------------------------------------------------
    python_line = re.search(r'File "<string>", line (\d+)', stderr)
    python_err = re.search(r"([A-Za-z]+Error):", stderr)

    if python_err:
        err_type = python_err.group(1)

        line = int(python_line.group(1)) if python_line else None

        return {
            "summary": err_type,
            "friendly": _friendly_python_message(err_type),
            "type": err_type,
            "line": line,
            "column": None,
        }

    # --- JAVASCRIPT ---------------------------------------------------------
    js_line_col = re.search(r":(\d+):(\d+)", stderr)
    js_err = re.search(r"(ReferenceError|TypeError|SyntaxError|RangeError)", stderr)

    if js_err:
        err_type = js_err.group(1)

        line = int(js_line_col.group(1)) if js_line_col else None
        col = int(js_line_col.group(2)) if js_line_col else None

        return {
            "summary": err_type,
            "friendly": _friendly_js_message(err_type),
            "type": err_type,
            "line": line,
            "column": col,
        }

    # UNKNOWN ---------------------------------------------------------------
    return {
        "summary": "UnknownError",
        "friendly": "An unknown error occurred during execution.",
        "type": "UnknownError",
        "line": None,
        "column": None,
    }


# -------------------------------------------------------------------------
# Friendly Messages
# -------------------------------------------------------------------------

def _friendly_python_message(err_type: str) -> str:
    messages = {
        "SyntaxError": "Python found invalid syntax. Check missing ':' or indentation levels.",
        "IndentationError": "Your indentation is incorrect. Python relies on exact indentation.",
        "NameError": "A variable is used before it is defined.",
        "TypeError": "A value is used with the wrong type.",
        "ValueError": "A function received an invalid value.",
        "ZeroDivisionError": "Division by zero is not allowed.",
        "IndexError": "A list index is out of range.",
        "KeyError": "A dictionary key does not exist.",
    }
    return messages.get(err_type, "A Python error occurred.")


def _friendly_js_message(err_type: str) -> str:
    messages = {
        "SyntaxError": "JavaScript found invalid syntax (missing brackets, commas, etc).",
        "ReferenceError": "You used a variable that is not defined.",
        "TypeError": "A value is being used in an incompatible way.",
        "RangeError": "A numeric value is outside the allowed range.",
    }
    return messages.get(err_type, "A JavaScript error occurred.")


# -------------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------------

def _human_time(ms: float) -> str:
    if ms < 1000:
        return f"{round(ms, 2)}ms"
    sec = ms / 1000
    if sec < 60:
        return f"{round(sec, 2)}s"
    return f"{round(sec / 60, 2)}m"


def _human_memory(mb: float) -> str:
    if mb < 1:
        return f"{round(mb * 1024, 0)}KB"
    return f"{round(mb, 2)}MB"
