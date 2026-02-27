# # File: backend/routers/simulation_router.py
# # Simulation/Code Execution Router

# from fastapi import APIRouter
# from pydantic import BaseModel
# import sys
# from pathlib import Path

# # Add backend directory to path
# _backend_dir = Path(__file__).parent.parent
# if str(_backend_dir) not in sys.path:
#     sys.path.insert(0, str(_backend_dir))

# from services.code_executor import CodeExecutor
# from services.test_generator import TestCaseGenerator

# simulation_router = APIRouter()

# class SimulationInput(BaseModel):
#     code: str
#     testcases: list = []

# class SimulationOutput(BaseModel):
#     output: list

# # Initialize services
# executor = CodeExecutor()
# test_gen = TestCaseGenerator()

# @simulation_router.post("/run")
# def run_simulation(data: SimulationInput):
#     """
#     Run code with automatic input generation if needed
#     If code requires inputs, generates default test inputs
#     Otherwise runs with empty input
#     """
#     try:
#         # Check if code requires input
#         input_count = test_gen.extract_input_count(data.code)
        
#         if input_count == 0:
#             # No input required - run with empty input
#             test_input = ""
#         else:
#             # Generate first test case with default inputs
#             test_inputs = test_gen._generate_test_inputs(input_count)
#             test_input = test_inputs[0] if test_inputs else ""
        
#         # Execute code with the input
#         result = executor.execute_python(data.code, input_data=test_input)
        
#         return {
#             "output": [{
#                 "input": test_input,
#                 "actual": result["output"].strip(),
#                 "error": result.get("error", ""),
#                 "runtime": result.get("runtime", "0ms"),
#                 "passed": len(result.get("error", "")) == 0
#             }]
#         }
#     except Exception as e:
#         return {
#             "output": [],
#             "error": str(e)
#         }

# File: backend/routers/simulation_router.py
# Simulation/Code Execution Router

from fastapi import APIRouter
from pydantic import BaseModel
import sys
from pathlib import Path

# Add backend directory to path
_backend_dir = Path(__file__).parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from services.code_executor import CodeExecutor
from services.test_generator import TestCaseGenerator

simulation_router = APIRouter()

class SimulationInput(BaseModel):
    code: str
    testcases: list = []

class SimulationOutput(BaseModel):
    output: list

# Initialize services
executor = CodeExecutor()
test_gen = TestCaseGenerator()

@simulation_router.post("/run")
def run_simulation(data: SimulationInput):
    """
    Run code with automatic input generation if needed
    If code requires inputs, generates default test inputs
    Otherwise runs with empty input
    """
    try:
        # Check if code requires input
        input_count = test_gen.extract_input_count(data.code)
        
        if input_count == 0:
            # No input required - run with empty input
            test_input = ""
        else:
            # Generate first test case with default inputs
            test_inputs = test_gen._generate_test_inputs(input_count)
            test_input = test_inputs[0] if test_inputs else ""
        
        # Execute code with the input
        result = executor.execute_python(data.code, input_data=test_input)
        
        return {
            "output": [{
                "input": test_input,
                "actual": result["output"].strip(),
                "error": result.get("error", ""),
                "runtime": result.get("runtime", "0ms"),
                "passed": len(result.get("error", "")) == 0
            }]
        }
    except Exception as e:
        return {
            "output": [],
            "error": str(e)
        }