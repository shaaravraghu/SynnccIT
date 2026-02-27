from typing import TypedDict, List, Dict
from langchain_google_genai import ChatGoogleGenerativeAI

import os
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
load_dotenv()

class CodeReviewState(TypedDict):
    """State that goes through nodes of our graph"""
    code: str
    initial_analysis: str
    issues: List[str]
    final_report: str

class SimpleCodeReviewAgent:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=os.getenv("GEMINI_API_KEY"),
            model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
            temperature=0,
        )


        self.graph = self._build_graph()

    def _analysis_agent(self, state: CodeReviewState) -> Dict:
        """Step1: Analyse the code"""
        prompt = f"""Analyse the code briefly:
            {state['code']}
        Focus on: purpose, structure and concerns.  
"""
        response = self.llm.invoke(prompt)
        return {"code": state["code"],
    "initial_analysis": response.content,
    "issues": state["issues"],
    "final_report": state["final_report"]}
    
    def _find_issues(self, state: CodeReviewState) -> Dict:
        """Step2 : Find the issues in code"""
        prompt = f"""Based on:{state["initial_analysis"]}
        Code: {state['code']}

        List 3-5 specific issues. Format each as "-issue".
"""
        
        response =self.llm.invoke(prompt)
        issues = [line.strip("-•0123456789. ").strip()
    for line in response.content.split("\n")
    if line.strip()]

        return {"issues": issues}
    
    def _generate_report(self, state: CodeReviewState) -> Dict:
        """Step3: Generate report from the review"""

        issues_text = '\n'.join(state['issues'])

        prompt = f"""Create a code review report:
        
        Analysis: {state['initial_analysis']}
        Issues: {state['issues']}

        Format Summary, Issues, and Recommendation.
"""
        
        response = self.llm.invoke(prompt)

        return {"final_report": response.content}
    
    def _build_graph(self) -> StateGraph:
        """Build the langgraph workflow"""

        workflow = StateGraph(CodeReviewState)

        #Add nodes 
        workflow.add_node("analyzer", self._analysis_agent)
        workflow.add_node("issue_finder", self._find_issues)
        workflow.add_node("report_generator", self._generate_report)

        # Add edges 
        workflow.set_entry_point("analyzer")
        workflow.add_edge("analyzer", "issue_finder")
        workflow.add_edge("issue_finder", "report_generator")
        workflow.add_edge("report_generator", END)

        return workflow.compile()
    