"""
Code and input sanitization for safe execution.
Prevents dangerous operations and invalid input.
"""

import re
from typing import List, Set

# Dangerous patterns that must not appear in user code
BLOCKED_PATTERNS_PYTHON: List[str] = [
    r"\b__import__\s*\(",
    r"\beval\s*\(",
    r"\bexec\s*\(",
    r"\bcompile\s*\(",
    r"\bopen\s*\([^)]*['\"]\.\./",  # path traversal
    r"\bos\.system\s*\(",
    r"\bos\.popen\s*\(",
    r"\bsubprocess\s*\.\s*",
    r"\bimport\s+os\s*$",
    r"\bimport\s+subprocess",
    r"\bimport\s+socket",
    r"\bimport\s+ctypes",
    r"\bimport\s+sys\s*;\s*sys\.modules",
    r"\bfile\s*\(",
    r"\binput\s*\(",  # can be allowed in sandbox with controlled stdin; block for safety
    r"\braw_input\s*\(",
    r"\b__builtins__\s*",
    r"\bgetattr\s*\(\s*__builtins__",
    r"\bbreakpoint\s*\(",
    r"\bglobals\s*\(",
    r"\blocals\s*\(",
    r"\bdir\s*\(",
    r"^\s*import\s+os\b",
    r"^\s*from\s+os\s+import",
]

BLOCKED_PATTERNS_JAVASCRIPT: List[str] = [
    r"require\s*\(\s*['\"]child_process",
    r"require\s*\(\s*['\"]fs['\"]\s*\)",
    r"require\s*\(\s*['\"]path['\"]\s*\)",
    r"require\s*\(\s*['\"]net['\"]\s*\)",
    r"require\s*\(\s*['\"]http['\"]\s*\)",
    r"require\s*\(\s*['\"]https['\"]\s*\)",
    r"require\s*\(\s*['\"]cluster['\"]\s*\)",
    r"require\s*\(\s*['\"]vm['\"]\s*\)",
    r"require\s*\(\s*['\"]worker_threads['\"]\s*\)",
    r"process\.env",
    r"process\.exit",
    r"process\.kill",
    r"child_process",
    r"execSync|spawnSync|exec\s*\(",
    r"eval\s*\(",
    r"Function\s*\(",
    r"new\s+Function\s*\(",
    r"__dirname",
    r"__filename",
    r"\.readFileSync|\.writeFileSync|\.readdirSync",
]

MAX_CODE_LENGTH = 100_000
MAX_INPUT_PARAMS_JSON_LENGTH = 50_000


class SanitizationError(Exception):
    """Raised when code or input fails sanitization."""

    pass


def _check_patterns(code: str, patterns: List[str], language: str) -> None:
    """Raise SanitizationError if any blocked pattern matches."""
    for pattern in patterns:
        if re.search(pattern, code, re.IGNORECASE | re.MULTILINE):
            raise SanitizationError(
                f"Blocked construct detected in {language} code (pattern: {pattern})"
            )


def sanitize_code(code: str, language: str) -> str:
    """
    Sanitize user code before execution.
    - Enforces length limit.
    - Blocks dangerous constructs.
    Returns stripped code.
    """
    if not code or not isinstance(code, str):
        raise SanitizationError("Code must be a non-empty string")

    code = code.strip()
    if len(code) > MAX_CODE_LENGTH:
        raise SanitizationError(f"Code exceeds maximum length of {MAX_CODE_LENGTH} characters")

    lang = language.lower()
    if lang == "python":
        _check_patterns(code, BLOCKED_PATTERNS_PYTHON, "python")
    elif lang in ("javascript", "js", "node"):
        _check_patterns(code, BLOCKED_PATTERNS_JAVASCRIPT, "javascript")
    else:
        raise SanitizationError(f"Unsupported language: {language}")

    return code


def sanitize_input_params(params: dict) -> dict:
    """
    Validate and sanitize input_params (e.g. for simulation).
    Prevents excessively large payloads.
    """
    if not isinstance(params, dict):
        raise SanitizationError("input_params must be a JSON object")

    import json

    try:
        serialized = json.dumps(params)
    except (TypeError, ValueError) as e:
        raise SanitizationError(f"input_params must be JSON-serializable: {e}")

    if len(serialized) > MAX_INPUT_PARAMS_JSON_LENGTH:
        raise SanitizationError(
            f"input_params serialized size exceeds {MAX_INPUT_PARAMS_JSON_LENGTH} characters"
        )

    return params


def validate_language(language: str) -> str:
    """Normalize and validate language; return 'python' or 'javascript'."""
    lang = (language or "").strip().lower()
    if lang in ("python", "py"):
        return "python"
    if lang in ("javascript", "js", "node"):
        return "javascript"
    raise SanitizationError(f"Unsupported language: {language}. Use 'python' or 'javascript'.")
