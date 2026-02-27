from pydantic import BaseModel
from typing import List

class CodeReviewRequest(BaseModel):
    code: str

class ExecuteCodeRequest(BaseModel):
    code: str
    language: str = "python"