"""
Pydantic models for the Test Case Generation and Run Tests pipelines.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TestCaseItem(BaseModel):
    """Single test case (input, expected, actual, passed)."""

    input: str = Field(..., description="Input representation (e.g. JSON or string)")
    expected: str = Field(default="", description="Expected output")
    actual: str = Field(default="", description="Actual output from execution")
    passed: bool = Field(..., description="Whether the test passed")


class GenerateTestCasesRequest(BaseModel):
    """Request body for POST /generate-testcases."""

    code: str = Field(..., description="Source code to generate test cases for")
    language: str = Field(..., description="'python' or 'javascript'")


class RunTestsRequest(BaseModel):
    """Request body for POST /run-tests."""

    code: str = Field(..., description="Source code to test")
    language: str = Field(..., description="'python' or 'javascript'")
    testcases: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of test cases: [{input, expected}, ...]",
    )


class CoverageReport(BaseModel):
    """Coverage metrics in final report."""

    branch: str = Field(default="0%", description="Branch coverage percentage")
    condition: str = Field(default="0%", description="Condition coverage percentage")
    loop: str = Field(default="0%", description="Loop iteration coverage percentage")
    weak_areas: List[str] = Field(default_factory=list, description="Identified weak areas")


class ErrorsReport(BaseModel):
    """Errors section in final test report."""

    summary: str = Field(default="", description="Short error summary")
    human_friendly_explanation: str = Field(default="", description="Human-readable explanation")


class FinalTestReport(BaseModel):
    """Complete test report as returned by backend."""

    simulation: Dict[str, Any] = Field(
        default_factory=lambda: {
            "output": "",
            "stderr": "",
            "runtime": "",
            "memory": "",
            "trace": [],
        },
        description="Simulation output block",
    )
    testcases: List[TestCaseItem] = Field(default_factory=list, description="Test case results")
    coverage: Dict[str, Any] = Field(
        default_factory=lambda: {"branch": "0%", "condition": "0%", "loop": "0%", "weak_areas": []},
        description="Coverage metrics",
    )
    errors: Dict[str, str] = Field(
        default_factory=lambda: {"summary": "", "human_friendly_explanation": ""},
        description="Error summary and human-friendly explanation",
    )
