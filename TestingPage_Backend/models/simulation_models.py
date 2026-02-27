"""
Pydantic models for the Run Simulation Pipeline.
Request/response schemas for simulation execution.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SimulationRequest(BaseModel):
    """Request body for POST /run-simulation."""

    code: str = Field(..., description="Source code to execute")
    language: str = Field(..., description="Language: 'python' or 'javascript'")
    input_params: Dict[str, Any] = Field(default_factory=dict, description="Input parameters for execution")


class TraceEntry(BaseModel):
    """Single execution trace entry."""

    line: int = Field(..., description="Line number")
    variable: Optional[str] = Field(None, description="Variable name if applicable")
    value: Optional[str] = Field(None, description="Value at trace point")
    event: str = Field(..., description="Event type: call, return, line, exception")


class SimulationOutput(BaseModel):
    """Simulation result (output sub-object in final report)."""

    output: str = Field(default="", description="stdout capture")
    stderr: str = Field(default="", description="stderr capture")
    runtime: str = Field(default="0ms", description="Execution time (human-readable)")
    memory: str = Field(default="0MB", description="Memory usage (human-readable)")
    trace: List[TraceEntry] = Field(default_factory=list, description="Execution trace")


class SimulationResponse(BaseModel):
    """Full response for run-simulation endpoint."""

    simulation: SimulationOutput = Field(..., description="Simulation execution result")
    errors: Optional[Dict[str, str]] = Field(
        default=None,
        description="summary and human_friendly_explanation if any error",
    )
