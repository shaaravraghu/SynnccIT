from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from schema import CodeReviewRequest, ExecuteCodeRequest
from agent import SimpleCodeReviewAgent
from execution import execute_python_code
from history import add_history_record, get_all_history
import uuid
from datetime import datetime


load_dotenv()


load_dotenv()
agent = SimpleCodeReviewAgent()
app = FastAPI()
@app.options("/review")
def review_options():
    return {}

@app.options("/execute")
def execute_options():
    return {}

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins =["http://localhost:3000"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def root():
    return {"message": "Backend is running 🚀"}

@app.post("/review")
def review_code(request: CodeReviewRequest):

    initial_state = {
        "code": request.code,
        "initial_analysis": "",
        "issues": [],
        "final_report": ""
    }

    result = agent.graph.invoke(initial_state)

    record = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "input_code": request.code,
        "review": {
            "analysis": result["initial_analysis"],
            "issues": result["issues"],
            "report": result["final_report"]
        },
        "execution": None
    }

    add_history_record(record)

    # return record
    return {
        "analysis": record["review"]["analysis"],
        "issues": record["review"]["issues"],
        "report": record["review"]["report"]
    }
@app.post("/execute")
def execute_code(request: ExecuteCodeRequest):

    if request.language != "python":
        return {"error": "Only Python supported for now"}

    result = execute_python_code(request.code)

    
    record = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "input_code": request.code,
        "review": None,
        "execution": {
            "output": result["stdout"],
            "error": result["stderr"]
        }
    
    }

    add_history_record(record)

    # return record
    return {
        "output": result["stdout"],
        "error": result["stderr"]
    }

@app.get("/history")
def fetch_history():
    return get_all_history()
