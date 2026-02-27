"""
Docker-based isolated code execution.
Enforces timeouts, memory/CPU limits, captures stdout/stderr, prevents file access and infinite loops.
"""

import json
import os
import subprocess
import tempfile
import time
from typing import Any, Dict, Optional, Tuple

# Default limits (override via env if needed)
EXEC_TIMEOUT_SEC = int(os.getenv("SANDBOX_TIMEOUT_SEC", "10"))
EXEC_MEMORY_MB = int(os.getenv("SANDBOX_MEMORY_MB", "128"))
EXEC_CPU_SHARES = int(os.getenv("SANDBOX_CPU_SHARES", "256"))  # relative to 1024
DOCKER_IMAGE_PYTHON = os.getenv("SANDBOX_IMAGE_PYTHON", "python-exec:latest")
DOCKER_IMAGE_NODE = os.getenv("SANDBOX_IMAGE_NODE", "node-exec:latest")


class DockerExecutorError(Exception):
    """Raised when Docker execution fails."""

    pass


def _get_image(language: str) -> str:
    lang = language.lower()
    if lang in ("python", "py"):
        return DOCKER_IMAGE_PYTHON
    if lang in ("javascript", "js", "node"):
        return DOCKER_IMAGE_NODE
    raise DockerExecutorError(f"Unsupported language for Docker: {language}")


def _write_script_and_input(
    code: str,
    language: str,
    stdin_content: str = "",
    work_dir: str = "",
) -> Tuple[str, str]:
    """
    Write code to a file and optional stdin file in work_dir.
    Returns (script_path_inside_container, stdin_path_inside_container or "").
    """
    if not work_dir:
        work_dir = tempfile.mkdtemp(prefix="sandbox_")

    if language.lower() in ("python", "py"):
        script_path = os.path.join(work_dir, "main.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)
        stdin_path = os.path.join(work_dir, "stdin.txt")
        with open(stdin_path, "w", encoding="utf-8") as f:
            f.write(stdin_content)
        return "/workspace/main.py", "/workspace/stdin.txt"
    if language.lower() in ("javascript", "js", "node"):
        script_path = os.path.join(work_dir, "main.js")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)
        stdin_path = os.path.join(work_dir, "stdin.txt")
        with open(stdin_path, "w", encoding="utf-8") as f:
            f.write(stdin_content)
        return "/workspace/main.js", "/workspace/stdin.txt"
    raise DockerExecutorError(f"Unsupported language: {language}")


def run_in_docker(
    code: str,
    language: str,
    stdin_content: str = "",
    timeout_sec: Optional[int] = None,
    memory_mb: Optional[int] = None,
    cpu_shares: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Execute code in a Docker container with limits.
    - timeouts
    - memory limit
    - CPU limit
    - capture stdout/stderr
    - no file access outside /workspace (handled by Dockerfile)
    - prevent infinite loops via timeout

    Returns:
        {
            "stdout": str,
            "stderr": str,
            "exit_code": int,
            "runtime_ms": float,
            "memory_peak_mb": float or None,
            "timed_out": bool,
            "error": str or None,
        }
    """
    timeout_sec = timeout_sec or EXEC_TIMEOUT_SEC
    memory_mb = memory_mb or EXEC_MEMORY_MB
    cpu_shares = cpu_shares or EXEC_CPU_SHARES

    image = _get_image(language)
    work_dir = tempfile.mkdtemp(prefix="sandbox_")
    try:
        script_inside, stdin_inside = _write_script_and_input(code, language, stdin_content, work_dir)

        # Run: docker run --rm -v work_dir:/workspace -i --memory=... --cpus=... timeout ...
        # - Read stdin from file inside container so we don't need -i for user input
        cmd = [
            "docker",
            "run",
            "--rm",
            "-v",
            f"{work_dir}:/workspace:ro",
            "--memory",
            f"{memory_mb}m",
            "--cpus",
            "0.25",  # equivalent to low CPU
            "--network",
            "none",
            "--read-only",
            "-e",
            "PYTHONUNBUFFERED=1",
            image,
            script_inside,
            stdin_inside,
            str(timeout_sec),
        ]

        start = time.perf_counter()
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_sec + 5,  # outer timeout slightly larger
            cwd=work_dir,
        )
        elapsed_ms = (time.perf_counter() - start) * 1000

        # Parse container output: we use a wrapper in the image that prints JSON last line
        stdout = proc.stdout or ""
        stderr = proc.stderr or ""
        exit_code = proc.returncode

        # Try to parse JSON result from stdout (if our runner prints it)
        runtime_ms = elapsed_ms
        memory_peak_mb = None
        timed_out = False
        run_error = None

        for line in reversed(stdout.strip().split("\n")):
            line = line.strip()
            if line.startswith("{") and "runtime_ms" in line:
                try:
                    data = json.loads(line)
                    runtime_ms = data.get("runtime_ms", elapsed_ms)
                    memory_peak_mb = data.get("memory_peak_mb")
                    timed_out = data.get("timed_out", False)
                    break
                except json.JSONDecodeError:
                    pass

        if "timeout" in stderr.lower() or "timed out" in stderr.lower():
            timed_out = True
        if exit_code != 0 and not run_error:
            run_error = stderr.strip() or f"Exit code {exit_code}"

        return {
            "stdout": stdout,
            "stderr": stderr,
            "exit_code": exit_code,
            "runtime_ms": round(runtime_ms, 2),
            "memory_peak_mb": memory_peak_mb,
            "timed_out": timed_out,
            "error": run_error,
        }
    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Execution timed out (infinite loop or heavy computation).",
            "exit_code": -1,
            "runtime_ms": (timeout_sec + 5) * 1000,
            "memory_peak_mb": None,
            "timed_out": True,
            "error": "Execution timed out.",
        }
    except FileNotFoundError:
        raise DockerExecutorError(
            "Docker not found or image not built. Build images with: "
            "docker build -f docker/python-exec.Dockerfile -t python-exec:latest ."
        )
    except Exception as e:
        raise DockerExecutorError(f"Docker execution failed: {e}")
    finally:
        try:
            import shutil

            shutil.rmtree(work_dir, ignore_errors=True)
        except Exception:
            pass
