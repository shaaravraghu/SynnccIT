from fastapi import APIRouter
from schema import CodeReviewRequest, ExecuteCodeRequest
from execution import execute_python_code
from history import add_history_record, get_all_history
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Lazy-loaded agent — only created on first API call, not at import/startup.
# This prevents a crash on module load when GEMINI_API_KEY is not set.
_agent = None

def _get_agent():
    global _agent
    if _agent is None:
        try:
            from agent import SimpleCodeReviewAgent
            _agent = SimpleCodeReviewAgent()
        except Exception as e:
            logger.error(f"Failed to initialize agent: {e}")
            raise RuntimeError(f"Agent not available: {e}")
    return _agent

agent_router = APIRouter()

@agent_router.get("/")
def root():
    return {"message": "Agent Backend is running 🚀"}

@agent_router.post("/review")
def review_code(request: CodeReviewRequest):
    agent = _get_agent()
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
    return {
        "analysis": record["review"]["analysis"],
        "issues": record["review"]["issues"],
        "report": record["review"]["report"]
    }

@agent_router.post("/execute")
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
    return {
        "output": result["stdout"],
        "error": result["stderr"]
    }

@agent_router.get("/history")
def fetch_history():
    return get_all_history()
