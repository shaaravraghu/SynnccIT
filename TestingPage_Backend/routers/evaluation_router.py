"""
Evaluation Router (Unified - Python & JS)

Performs:
- sandbox run
- output normalization
- static scoring
- code quality evaluation
"""

import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException

from pydantic import BaseModel, Field

from typing import Any, Dict, List, Optional

# Add backend directory to path
_backend_dir = Path(__file__).parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

try:
    from services.sandbox_runner import run_python_sandbox, run_js_sandbox
    from services.result_formatter import format_simulation_output, format_testcase_result
except ImportError:
    # Handle case where services don't exist yet
    run_python_sandbox = None
    run_js_sandbox = None
    format_simulation_output = None
    format_testcase_result = None



router = APIRouter(prefix="/evaluation", tags=["Evaluation"])





class EvaluateRequest(BaseModel):

    code: str = Field(..., description="Source code to evaluate")

    language: str = Field(..., description="'python' or 'javascript'")

    inputs: Optional[List[Any]] = Field(default=None)

    simulation_context: Optional[Dict[str, Any]] = None





class EvaluateResponse(BaseModel):

    score: float

    summary: str

    suggestions: List[str]

    metrics: Dict[str, Any]

    simulation: Dict[str, Any]

    errors: Dict[str, Any]





# -------------------------------------------------------------------------

# Evaluation Logic

# -------------------------------------------------------------------------



def static_quality_checks(code: str) -> List[str]:

    """Basic static suggestions."""

    suggestions = []



    if len(code.strip().splitlines()) < 3:

        suggestions.append("Code is very short; add more implementation.")



    if "def " not in code and "function " not in code and "=>" not in code:

        suggestions.append("Consider using functions for better structure.")



    if "print" not in code and "console.log" not in code:

        suggestions.append("No output statement found.")



    return suggestions





def compute_score(suggestions: List[str], errors: Dict[str, Any]) -> float:

    score = 80.0



    if errors.get("summary"):

        score -= 25



    score -= len(suggestions) * 5



    return max(5, min(score, 100))





# -------------------------------------------------------------------------

# API Endpoint

# -------------------------------------------------------------------------



@router.post("/", response_model=EvaluateResponse)

async def evaluate(req: EvaluateRequest):



    try:

        # Run sandbox

        if req.language.lower() == "python":

            raw = run_python_sandbox(req.code, req.inputs or [])

        elif req.language.lower() == "javascript":

            raw = run_js_sandbox(req.code, req.inputs or [])

        else:

            raise HTTPException(status_code=400, detail="Unsupported language")



        # Format runtime output

        formatted = format_simulation_output(

            stdout=raw.get("stdout", ""),

            stderr=raw.get("stderr", ""),

            runtime_ms=raw.get("time_ms", 0),

            memory_mb=raw.get("memory_mb"),

            trace=raw.get("trace", []),

        )



        # Static review

        suggestions = static_quality_checks(req.code)

        score = compute_score(suggestions, formatted["errors"])



        return EvaluateResponse(

            score=score,

            summary=f"Evaluation complete. Score: {score}/100",

            suggestions=suggestions,

            metrics={

                "language": req.language,

                "lines": len(req.code.splitlines())

            },

            simulation=formatted["simulation"],

            errors=formatted["errors"],

        )



    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))