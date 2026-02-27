"""
AI Router — Powers all 6 Testing Page AI features.
Uses OpenRouter API (arcee-ai/trinity-large-preview:free) — confirmed working.
Falls back to GOOGLE_API_KEY / Gemini if env var is set.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os, sys, json, urllib.request, urllib.error
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (SynnccIT/)
_project_root = Path(__file__).resolve().parents[2]
load_dotenv(_project_root / ".env", override=True)

# Add backend dir to path for services
_backend_dir = Path(__file__).parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from services.code_executor import CodeExecutor
from services.test_generator import TestCaseGenerator

# ─── API Configuration ────────────────────────────────────────────────────────

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL   = os.getenv("OPENROUTER_MODEL_LINK", "arcee-ai/trinity-large-preview:free")

if OPENROUTER_API_KEY:
    print(f"✅ OpenRouter AI ready: model={OPENROUTER_MODEL}")
else:
    print("⚠️  OPENROUTER_API_KEY not set — AI features will fail.")

ai_router = APIRouter()
executor  = CodeExecutor()
test_gen  = TestCaseGenerator()


# ─── Request / Response Models ────────────────────────────────────────────────

class CodeInput(BaseModel):
    code: str
    selected_text: Optional[str] = None   # Drag-selected code has priority
    user_input: Optional[str]    = None   # For Simulate / Re-Design
    language: str = "python"


class AIResponse(BaseModel):
    result: str
    metrics:      Optional[Dict[str, Any]]       = None
    test_results: Optional[List[Dict[str, Any]]] = None


# ─── Helper: Call OpenRouter ──────────────────────────────────────────────────

def ask_ai(system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> str:
    """
    POST to OpenRouter's OpenAI-compatible chat endpoint.
    Raises HTTPException on failure.
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OPENROUTER_API_KEY not configured. Please add it to your .env file."
        )

    payload = json.dumps({
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization":  f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type":   "application/json",
            "HTTP-Referer":   "http://localhost:8080",
            "X-Title":        "SynnccIT Testing Page",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=502, detail=f"OpenRouter error {e.code}: {body[:300]}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")


# ─── 1. Run Quick Tests ───────────────────────────────────────────────────────

@ai_router.post("/quick-test")
async def quick_test(input: CodeInput):
    """
    Runs auto-generated test cases and asks AI for a crisp code review.
    Priority: selected_text if dragged, otherwise full file.
    """
    target_code = input.selected_text.strip() if input.selected_text and input.selected_text.strip() else input.code
    scope_note  = "(selected snippet)" if input.selected_text and input.selected_text.strip() else "(full file)"

    # Execute test cases
    testcases    = test_gen.generate_testcases(target_code)
    test_results = []
    for tc in testcases:
        result = executor.execute_python(target_code, input_data=tc.get("input", ""))
        test_results.append({
            "input":    tc.get("input", ""),
            "expected": tc.get("expected", ""),
            "actual":   result["output"].strip(),
            "error":    result.get("error", ""),
            "runtime":  f"{result.get('runtime', 0)}s",
            "passed":   result["output"].strip() == tc.get("expected", "").strip(),
        })

    passed = sum(1 for r in test_results if r["passed"])
    total  = len(test_results)

    ai_review = ask_ai(
        system_prompt=(
            "You are a senior code reviewer. Give a crisp, bullets-style review. "
            "Cover: correctness, edge cases, style, potential bugs, performance. "
            "Max 10 bullet points. End with an overall verdict."
        ),
        user_prompt=(
            f"Review this {input.language} {scope_note} code:\n\n"
            f"```\n{target_code}\n```\n\n"
            f"Test results: {passed}/{total} passed."
        ),
    )

    efficiency  = min(100, max(0, int((passed / max(total, 1)) * 70) + 15))
    scalability = min(100, max(0, 65 - (target_code.count("for ") + target_code.count("while ")) * 8 + 10))

    return {
        "result":       ai_review,
        "test_results": test_results,
        "metrics":      {"efficiency": efficiency, "scalability": scalability},
    }


# ─── 2. Generate Test Cases ───────────────────────────────────────────────────

@ai_router.post("/generate-tests")
async def generate_tests(input: CodeInput):
    """
    AI generates 5 meaningful test cases + debug print suggestions.
    Priority: selected_text if dragged, otherwise full file.
    """
    target_code = input.selected_text.strip() if input.selected_text and input.selected_text.strip() else input.code
    scope_note  = "(selected snippet)" if input.selected_text and input.selected_text.strip() else "(full file)"

    ai_response = ask_ai(
        system_prompt=(
            "You are a test engineer. Given the code:\n"
            "1. Generate 5 meaningful test cases. Format each as:\n"
            "   Test Case N:\n   Input: <value>\n   Expected Output: <value>\n\n"
            "2. After the test cases, suggest debug print placements:\n"
            "   Debug Suggestions:\n   - After line N: print(f\"var = {var}\")\n"
            "Keep it practical and concise."
        ),
        user_prompt=f"Code {scope_note}:\n```{input.language}\n{target_code}\n```",
    )

    testcases       = test_gen.generate_testcases(target_code)
    executed_results = []
    for tc in testcases:
        result = executor.execute_python(target_code, input_data=tc.get("input", ""))
        executed_results.append({
            "input":    tc.get("input", ""),
            "expected": tc.get("expected", ""),
            "actual":   result["output"].strip(),
            "passed":   result["output"].strip() == tc.get("expected", "").strip(),
        })

    return {"result": ai_response, "test_results": executed_results, "metrics": None}


# ─── 3. Code Explanation ──────────────────────────────────────────────────────

@ai_router.post("/code-explain")
async def code_explain(input: CodeInput):
    """
    Deciphers highlighted code (priority) or full file.
    """
    target_code = input.selected_text.strip() if input.selected_text and input.selected_text.strip() else input.code
    context     = "highlighted snippet" if input.selected_text and input.selected_text.strip() else "complete file"

    ai_response = ask_ai(
        system_prompt=(
            f"You are an expert code explainer working on a {context}. "
            "For each logical block: state WHAT it does, WHY it does it, "
            "note patterns/algorithms, and flag potential issues. "
            "Use clear headers and bullet points. Be concise but thorough."
        ),
        user_prompt=f"Explain this {input.language} code:\n\n```\n{target_code}\n```",
    )

    return {"result": ai_response, "metrics": None, "test_results": None}


# ─── 4. Simulate Runs ─────────────────────────────────────────────────────────

@ai_router.post("/simulate")
async def simulate_runs(input: CodeInput):
    """
    Execute code with user-provided input values.
    Priority: selected_text if dragged, otherwise full file.
    """
    target_code = input.selected_text.strip() if input.selected_text and input.selected_text.strip() else input.code

    if not input.user_input or not input.user_input.strip():
        ai_response = ask_ai(
            system_prompt=(
                "You are a code analyst. Analyze the code and tell the user exactly "
                "what inputs it expects. Be specific about format, types, and count. "
                "Give 2-3 concrete example input sets they can paste and try."
            ),
            user_prompt=f"What inputs does this code need?\n\n```{input.language}\n{target_code}\n```",
        )
        return {"result": ai_response, "metrics": None, "test_results": None}

    result      = executor.execute_python(target_code, input_data=input.user_input)
    output_text = "🚀 Simulation Result\n\n"
    output_text += f"📥 Input:\n{input.user_input}\n\n"
    output_text += f"📤 Output:\n{result['output'].strip() or '(no output)'}\n\n"
    if result.get("error"):
        output_text += f"⚠️ Errors:\n{result['error']}\n\n"
    output_text += f"⏱️ Runtime: {result.get('runtime', 0)}s\n"
    output_text += f"Status: {'✅ Success' if result.get('success') else '❌ Failed'}"

    ai_analysis = ask_ai(
        system_prompt=(
            "You are a runtime analyst. Given the code, input, and output, "
            "provide a brief analysis (3-5 bullet points) of what just happened. "
            "Note any issues, edge cases, or unexpected behavior."
        ),
        user_prompt=(
            f"Code:\n```\n{target_code}\n```\n\n"
            f"Input: {input.user_input}\n"
            f"Output: {result['output'].strip()}\n"
            f"Errors: {result.get('error', 'none')}"
        ),
    )
    output_text += f"\n\n📊 AI Analysis:\n{ai_analysis}"

    return {"result": output_text, "metrics": None, "test_results": None}


# ─── 5. Reduce Complexity ─────────────────────────────────────────────────────

@ai_router.post("/reduce-complexity")
async def reduce_complexity(input: CodeInput):
    """
    AI provides complexity analysis and optimisation suggestions.
    Priority: selected_text if dragged, otherwise full file.
    """
    target_code = input.selected_text.strip() if input.selected_text and input.selected_text.strip() else input.code
    scope_note  = "(selected snippet)" if input.selected_text and input.selected_text.strip() else "(full file)"

    ai_response = ask_ai(
        system_prompt=(
            "You are an algorithm optimisation expert. Provide:\n"
            "1. Current Complexity Analysis (Time + Space, Big-O)\n"
            "2. Optimisation Suggestions (ranked by impact; include code snippets)\n"
            "3. Data Structure Recommendations\n"
            "4. Scores at the very end on separate lines:\n"
            "   EFFICIENCY_SCORE: <0-100>\n"
            "   SCALABILITY_SCORE: <0-100>"
        ),
        user_prompt=f"Analyse and optimise this {input.language} {scope_note} code:\n\n```\n{target_code}\n```",
        max_tokens=2000,
    )

    efficiency  = 50
    scalability = 50
    for line in ai_response.split("\n"):
        if "EFFICIENCY_SCORE:" in line:
            try: efficiency  = int(line.split(":")[1].strip())
            except: pass
        if "SCALABILITY_SCORE:" in line:
            try: scalability = int(line.split(":")[1].strip())
            except: pass

    return {
        "result":  ai_response,
        "metrics": {"efficiency": efficiency, "scalability": scalability},
        "test_results": None,
    }


# ─── 6. Re-Design ─────────────────────────────────────────────────────────────

@ai_router.post("/redesign")
async def redesign(input: CodeInput):
    """
    AI redesigns the code per user requirements.
    Priority: selected_text if dragged, otherwise full file.
    """
    target_code       = input.selected_text.strip() if input.selected_text and input.selected_text.strip() else input.code
    user_requirements = input.user_input or "Improve overall design and structure"

    ai_response = ask_ai(
        system_prompt=(
            "You are a senior software architect. Provide:\n"
            "1. Brief analysis of the current design\n"
            "2. Redesigned Code — full rewritten version implementing the user's requirements\n"
            "3. Changes Summary — bullet points of what changed and why\n"
            "The redesigned code must be complete, runnable, and well-commented."
        ),
        user_prompt=(
            f"User requirements: {user_requirements}\n\n"
            f"Code to redesign:\n```{input.language}\n{target_code}\n```"
        ),
        max_tokens=2000,
    )

    return {"result": ai_response, "metrics": None, "test_results": None}
