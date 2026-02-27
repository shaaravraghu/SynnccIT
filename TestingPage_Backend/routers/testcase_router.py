
# File: backend/routers/testcase_router.py
# Test Case Generation and Execution Router

from fastapi import APIRouter
from pydantic import BaseModel
import sys
from pathlib import Path

# Add backend directory to path
_backend_dir = Path(__file__).parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from services.test_generator import TestCaseGenerator
from services.code_executor import CodeExecutor

testcase_router = APIRouter()

class CodeInput(BaseModel):
    code: str

# Initialize services
test_gen = TestCaseGenerator()
executor = CodeExecutor()

@testcase_router.post("/generate")
def generate_testcases(input: CodeInput):
    """Generate test cases based on code analysis"""
    try:
        testcases = test_gen.generate_testcases(input.code)
        return {"testcases": testcases}
    except Exception as e:
        return {"testcases": [], "error": str(e)}

@testcase_router.post("/runAll")
def run_all_testcases(input: CodeInput):
    """Generate test cases and run all of them"""
    try:
        testcases = test_gen.generate_testcases(input.code)
        results = []
        
        for tc in testcases:
            result = executor.execute_python(
                input.code,
                input_data=tc.get("input", "")
            )
            
            results.append({
                "input": tc.get("input", ""),
                "actual": result["output"].strip(),
                "expected": tc.get("expected", ""),
                "error": result.get("error", ""),
                "runtime": result.get("runtime", "0ms"),
                "passed": result["output"].strip() == tc.get("expected", "").strip()
            })
        
        return {"output": results}
    except Exception as e:
        return {"output": [], "error": str(e)}