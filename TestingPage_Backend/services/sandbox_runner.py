"""
Sandbox Runner
Supports:
- Python execution
- JavaScript execution (Node.js)
Cross-platform memory measurement (Windows-safe)
Returns:
{
    "stdout": str,
    "stderr": str,
    "time_ms": float,
    "memory_mb": float,
    "trace": []
}
"""

import subprocess
import tempfile
import time
import sys
import os
from typing import Any, Dict, List

# Try cross-platform memory fetch
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False


# ------------------------------------------------------------
# Helper: Get memory usage MB (Windows/Linux/macOS)
# ------------------------------------------------------------

def _get_memory_mb(pid: int) -> float:
    if HAS_PSUTIL:
        try:
            p = psutil.Process(pid)
            return p.memory_info().rss / (1024 * 1024)
        except Exception:
            return 0.0
    return 0.0  # fallback if psutil not installed


# ------------------------------------------------------------
# Python Sandbox Runner
# ------------------------------------------------------------

def run_python_sandbox(code: str, inputs: List[Any]) -> Dict[str, Any]:
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".py")
    temp_file.write(code.encode())
    temp_file.close()

    start = time.time()

    try:
        proc = subprocess.Popen(
            [sys.executable, temp_file.name],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        input_data = "\n".join(str(x) for x in inputs)

        stdout, stderr = proc.communicate(input_data, timeout=5)

    except subprocess.TimeoutExpired:
        proc.kill()
        stdout, stderr = "", "TimeoutError: Execution exceeded 5 seconds."

    end = time.time()

    mem = _get_memory_mb(proc.pid)

    return {
        "stdout": stdout,
        "stderr": stderr,
        "time_ms": round((end - start) * 1000, 2),
        "memory_mb": round(mem, 3),
        "trace": [],
    }


# ------------------------------------------------------------
# JavaScript Sandbox Runner (Node.js)
# ------------------------------------------------------------

def run_js_sandbox(code: str, inputs: List[Any]) -> Dict[str, Any]:
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".js")
    temp_file.write(code.encode())
    temp_file.close()

    start = time.time()

    try:
        proc = subprocess.Popen(
            ["node", temp_file.name],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        input_data = "\n".join(str(x) for x in inputs)

        stdout, stderr = proc.communicate(input_data, timeout=5)

    except subprocess.TimeoutExpired:
        proc.kill()
        stdout, stderr = "", "TimeoutError: Execution exceeded 5 seconds."

    end = time.time()

    mem = _get_memory_mb(proc.pid)

    return {
        "stdout": stdout,
        "stderr": stderr,
        "time_ms": round((end - start) * 1000, 2),
        "memory_mb": round(mem, 3),
        "trace": [],
    }
