"""
Code Pre-Processor: prepares user code and input for sandbox execution.
Injects input parameters as stdin or as a small harness where applicable.
"""

import json
from typing import Any, Dict, Tuple


def preprocess_for_execution(
    code: str,
    language: str,
    input_params: Dict[str, Any],
) -> Tuple[str, str]:
    """
    Prepare code and stdin for execution.
    - code: sanitized user code
    - language: 'python' or 'javascript'
    - input_params: dict of named inputs (e.g. {"a": 1, "b": 2})

    Returns (processed_code, stdin_content).
    For Python/JS we pass input as JSON lines or key=value lines on stdin so the
    container can optionally read them; the code itself is unchanged unless we add
    a thin wrapper that reads stdin and calls user code (optional).
    """
    stdin_parts = []
    if input_params:
        # Pass as single JSON line so runner can expose to code if needed
        try:
            stdin_parts.append(json.dumps(input_params))
        except (TypeError, ValueError):
            stdin_parts.append("{}")

    stdin_content = "\n".join(stdin_parts)
    if stdin_content and not stdin_content.endswith("\n"):
        stdin_content += "\n"

    # Optional: wrap Python code to read stdin and set vars (e.g. for "input_params" support)
    # Here we keep code as-is; the container just feeds stdin to the process.
    # If the user's code uses input(), it will read from our stdin.
    processed_code = code
    return processed_code, stdin_content


def inject_input_params_into_python(code: str, input_params: Dict[str, Any]) -> str:
    """
    Optional: prepend lines that set variables from input_params so user code
    can assume e.g. a=1, b=2 without reading stdin. Use for simulation when
    we want named params.
    """
    if not input_params:
        return code
    lines = []
    for k, v in input_params.items():
        try:
            lines.append(f"{k} = {repr(v)}")
        except Exception:
            lines.append(f'{k} = "{v}"')
    return "\n".join(lines) + "\n\n" + code
