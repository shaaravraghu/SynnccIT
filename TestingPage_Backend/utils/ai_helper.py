"""
AI Integration for Gemini.
Updated to prefer Gemini and use GEMINI_MODEL.
"""

import os
from dotenv import load_dotenv
from typing import Any, Dict, List, Optional
import json

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

def get_gemini_client():
    """Return Gemini client if key is set; else None."""
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        return genai
    except ImportError:
        return None

def explain_error_human_friendly(
    raw_error: str,
    code_snippet: str = "",
    language: str = "python",
) -> str:
    """
    Use AI to produce a human-friendly explanation of an execution error.
    """
    genai = get_gemini_client()
    if genai:
        try:
            model = genai.GenerativeModel(GEMINI_MODEL)
            prompt = f"""
            You are a helpful programming tutor. Explain runtime errors in simple terms and suggest how to fix them.
            Be concise (2-4 sentences).

            Language: {language}
            Error:
            {raw_error}

            Code snippet (if relevant):
            {code_snippet[:500]}
            """
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception:
            pass

    return _fallback_error_explanation(raw_error, language)

def _fallback_error_explanation(raw_error: str, language: str) -> str:
    """Provide a basic human-friendly explanation without AI."""
    err_lower = raw_error.lower()
    if "syntaxerror" in err_lower or "syntax error" in err_lower:
        return (
            "There is a syntax error in your code—likely a missing bracket, colon, or typo. "
            "Check the line number in the error and fix the syntax."
        )
    if "nameerror" in err_lower or "name error" in err_lower:
        return (
            "A variable or name is used before it is defined, or it's misspelled. "
            "Define the variable before use or fix the name."
        )
    if "typeerror" in err_lower or "type error" in err_lower:
        return (
            "A value has an unexpected type (e.g. using a number where a string is expected). "
            "Check types and convert or fix the operation."
        )
    if "indexerror" in err_lower or "index error" in err_lower:
        return "You're accessing a list or string index that doesn't exist. Check the index and length."
    if "keyerror" in err_lower or "key error" in err_lower:
        return "You're accessing a dictionary key that doesn't exist. Check the key name or use .get()."
    if "timeout" in err_lower or "timed out" in err_lower:
        return "The code took too long to run. There may be an infinite loop or very heavy computation."
    return f"The code failed with: {raw_error[:200]}. Review the error message and fix the cause."

def generate_missing_cases_ai(
    code: str,
    language: str,
    existing_inputs: List[Dict[str, Any]] = None,
    max_new: int = 5,
) -> List[Dict[str, Any]]:
    """
    Use AI to suggest additional test cases.
    """
    existing_inputs = existing_inputs or []
    genai = get_gemini_client()
    if genai:
        try:
            model = genai.GenerativeModel(GEMINI_MODEL)
            prompt = f"""
            Given this {language} code, suggest up to {max_new} additional test cases that would improve coverage.
            Include standard, boundary, and edge cases. 
            Existing test inputs: {json.dumps(existing_inputs)[:500]}.

            Code:
            ```{language}
            {code[:3000]}
            ```

            Respond with ONLY a JSON array of objects, each with keys "input" and "expected". 
            Example: [{{"input": "1\\n2", "expected": "3"}}]
            """

            response = model.generate_content(prompt)
            if response and response.text:
                text = response.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                
                arr = json.loads(text)
                if isinstance(arr, list):
                    return [{"input": str(x.get("input", "")), "expected": str(x.get("expected", ""))} for x in arr[:max_new]]
        except Exception:
            pass

    return []
