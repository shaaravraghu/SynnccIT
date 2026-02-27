# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# import subprocess, tempfile, time, os

# # Allow running via `uvicorn main:app` from inside `backend/`
# # while keeping strict absolute imports (`backend.*`).
# import sys
# from pathlib import Path

# _PROJECT_ROOT = Path(__file__).resolve().parents[1]
# if str(_PROJECT_ROOT) not in sys.path:
#     sys.path.insert(0, str(_PROJECT_ROOT))

# from backend.routers.flowchart_router import router as flowchart_router






# app = FastAPI(title="AI IDE Backend")
# app.include_router(flowchart_router)

# # --------------------------
# # CORS
# # --------------------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Register routers after app is created
# app.include_router(flowchart_router)

# # --------------------------
# # Helper: Safe Python Runner
# # --------------------------
# def run_python(code: str, stdin_data: str = ""):
#     """
#     Executes Python code safely with optional stdin.
#     """
#     with tempfile.TemporaryDirectory() as tmpdir:
#         file_path = os.path.join(tmpdir, "run.py")

#         with open(file_path, "w") as f:
#             f.write(code)

#         try:
#             start = time.time()

#             result = subprocess.run(
#                 ["python", file_path],
#                 input=stdin_data.encode(),
#                 capture_output=True,
#                 timeout=5
#             )

#             end = time.time()

#             return {
#                 "output": result.stdout.decode(),
#                 "stderr": result.stderr.decode(),
#                 "runtime": round(end - start, 4),
#                 "memory": 0,
#                 "trace": []
#             }

#         except subprocess.TimeoutExpired:
#             return {
#                 "output": "",
#                 "stderr": "Execution timed out",
#                 "runtime": 5,
#                 "memory": 0,
#                 "trace": []
#             }
# class CodeInput(BaseModel):
#     code: str





# # --------------------------
# # Request Models
# # --------------------------
# class SimulationRequest(BaseModel):
#     code: str
#     language: str = "python"
#     input_params: dict = {}


# class GenerateTestsRequest(BaseModel):
#     code: str
#     language: str = "python"


# class RunTestsRequest(BaseModel):
#     code: str
#     language: str = "python"
#     testcases: list = []


# # FIX-2 → Add input field
# class QuickRunRequest(BaseModel):
#     code: str
#     input: str = ""      # added to avoid EOFError


# # --------------------------
# # 1) /run-simulation
# # --------------------------

# @app.post("/run-simulation")
# def run_simulation(req: SimulationRequest):
#     try:
#         # FIX 1: If user input_params is empty → use default values
#         if not req.input_params:
#             stdin_data = "2\n3"  # default fallback values
#         else:
#             # FIX 2: Convert input_params dict → multiline string
#             stdin_data = "\n".join(str(v) for v in req.input_params.values())

#         output = run_python(req.code, stdin_data)

#         return {
#             "simulation": output,
#             "errors": None
#         }
#     except Exception as e:
#         raise HTTPException(400, str(e))



# # --------------------------
# # 2) /generate-testcases
# # --------------------------
# @app.post("/generate-testcases")
# def generate_testcases(req: GenerateTestsRequest):
#     count_inputs = req.code.count("input(")

#     if count_inputs == 2:
#         cases = [
#             {"input": "2\n3", "expected": "5"},
#             {"input": "10\n5", "expected": "15"},
#             {"input": "-1\n4", "expected": "3"},
#         ]
#     else:
#         cases = [{"input": "", "expected": ""}]

#     return {"testcases": cases}


# # --------------------------
# # 3) /run-tests
# # --------------------------
# @app.post("/run-tests")
# def run_tests(req: RunTestsRequest):
#     results = []

#     for tc in req.testcases:
#         input_data = tc.get("input", "")
#         expected = (tc.get("expected") or "").strip()

#         sim = run_python(req.code, input_data)
#         actual = sim["output"].strip()

#         results.append({
#             "input": input_data,
#             "expected": expected,
#             "actual": actual,
#             "passed": actual == expected
#         })

#     coverage = {"line_coverage": 0.75, "branch_coverage": 0.5}

#     return {
#         "simulation": results[0] if results else None,
#         "testcases": results,
#         "coverage": coverage,
#         "errors": None
#     }


# # --------------------------
# # 4) FIX-3 → Improved /run/python
# # --------------------------
# @app.post("/run/python")
# def run_python_quick(req: QuickRunRequest):
#     try:
#         stdin_value = req.input or ""
#         result = run_python(req.code, stdin_value)
#         return result
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
# ## Flowchart endpoint is handled by backend.routers.flowchart_router


# # --------------------------
# # Home
# # --------------------------
# @app.get("/")
# def home():
#     return {"status": "Backend Running"}
# backend/main.py

# import sys
# from pathlib import Path

# # Add backend directory to path to allow module imports
# _backend_dir = Path(__file__).parent
# if str(_backend_dir) not in sys.path:
#     sys.path.insert(0, str(_backend_dir))

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from routers.testcase_router import testcase_router
# from routers.simulation_router import simulation_router
# from routers.flowchart_router import flowchart_router

# app = FastAPI(title="AI Testing Backend")

# # CORS — allow frontend to access backend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Register routers
# app.include_router(testcase_router, prefix="/api/testcases")
# app.include_router(simulation_router, prefix="/api/simulation")
# app.include_router(flowchart_router, prefix="/api/flowchart")

# @app.get("/")
# def home():
#     return {"message": "Backend is running!"}
# File: backend/main.py
# COMPLETE FASTAPI BACKEND SETUP

import sys
from pathlib import Path

# Add backend directory to path to allow module imports
_backend_dir = Path(__file__).parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.testcase_router import testcase_router
from routers.simulation_router import simulation_router
from routers.flowchart_router import flowchart_router
from routers.ai_router import ai_router

app = FastAPI(
    title="AI Code Reviewer Backend",
    description="Backend for testing, simulation, and flowchart generation",
    version="1.0.0"
)

# CORS — allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with API prefix
app.include_router(testcase_router, prefix="/api/testcases", tags=["Test Cases"])
app.include_router(simulation_router, prefix="/api/simulation", tags=["Simulation"])
app.include_router(flowchart_router, prefix="/api/flowchart", tags=["Flowchart"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Features"])

@app.get("/")
def home():
    return {
        "message": "AI Code Reviewer Backend is running!",
        "endpoints": {
            "testcases": "/api/testcases",
            "simulation": "/api/simulation",
            "flowchart": "/api/flowchart"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}