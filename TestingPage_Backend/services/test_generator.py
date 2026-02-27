"""
Test Case Generator Service
Analyzes code and generates test cases based on input() calls and logic
Executes code to get actual expected outputs
"""

import re
import ast
import subprocess
import tempfile
import sys
import os
from typing import List, Dict, Any


class TestCaseGenerator:
    """Generate test cases based on code analysis"""

    def generate_testcases(self, code: str) -> List[Dict[str, Any]]:
        """Generate test cases based on code structure and execute to get actual outputs"""
        
        # Count input() calls in the code
        input_count = self._count_input_calls(code)

        # Generate test input values based on input count
        test_inputs = self._generate_test_inputs(input_count)
        
        # Execute code with each test input and capture actual outputs
        testcases = []
        for test_input in test_inputs:
            expected_output = self._execute_code_get_output(code, test_input)
            testcases.append({
                "input": test_input,
                "expected": expected_output
            })
        
        return testcases

    def _count_input_calls(self, code: str) -> int:
        """
        Count actual input() function calls in the code
        More accurate than simple string counting
        """
        count = 0
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    # Check if it's a direct input() call
                    if isinstance(node.func, ast.Name) and node.func.id == "input":
                        count += 1
            return count
        except SyntaxError:
            # Fallback to simple counting
            return code.count("input(")

    def _generate_test_inputs(self, input_count: int) -> List[str]:
        """Generate meaningful test inputs based on input count"""
        
        if input_count == 0:
            # No input required - only one test case with empty input
            return [""]
        
        elif input_count == 1:
            # Single input - test with different values
            return ["5", "10", "0"]
        
        elif input_count == 2:
            # Two inputs - test with different combinations
            return [
                "2\n3",
                "5\n10",
                "0\n0",
            ]
        
        elif input_count == 3:
            # Three inputs
            return [
                "1\n2\n3",
                "5\n10\n15",
                "2\n2\n2",
            ]
        
        else:
            # Multiple inputs - generate a few test cases
            test_cases = []
            
            # Test case 1: sequential numbers
            test_cases.append("\n".join(str(i) for i in range(1, input_count + 1)))
            
            # Test case 2: all same values
            test_cases.append("\n".join(str(5) for _ in range(input_count)))
            
            # Test case 3: zeros
            test_cases.append("\n".join(str(0) for _ in range(input_count)))
            
            return test_cases

    def _execute_code_get_output(self, code: str, input_data: str) -> str:
        """
        Execute Python code with given input and return actual output
        
        Args:
            code: Python code to execute
            input_data: Input string (lines separated by \n)
            
        Returns:
            Actual output from code execution
        """
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                file_path = os.path.join(tmpdir, "run.py")

                with open(file_path, "w") as f:
                    f.write(code)

                try:
                    result = subprocess.run(
                        [sys.executable, file_path],
                        input=input_data.encode() if input_data else None,
                        capture_output=True,
                        timeout=5,
                        text=False,
                    )

                    # Get output, prioritizing stdout, fallback to stderr
                    stdout = result.stdout.decode("utf-8", errors="replace").strip()
                    stderr = result.stderr.decode("utf-8", errors="replace").strip()

                    # Return stdout if available, otherwise stderr
                    if stdout:
                        return stdout
                    elif stderr:
                        return f"Error: {stderr}"
                    else:
                        return ""

                except subprocess.TimeoutExpired:
                    return "Error: Execution timed out (exceeded 5 seconds)"
                except Exception as e:
                    return f"Error: {str(e)}"

        except Exception as e:
            return f"Error: {str(e)}"

    def extract_input_count(self, code: str) -> int:
        """Extract number of input() calls using AST parsing"""
        return self._count_input_calls(code)

    def analyze_code_structure(self, code: str) -> Dict[str, Any]:
        """Analyze code for loops, conditionals, and variables"""
        try:
            tree = ast.parse(code)
        except SyntaxError:
            return {"error": "Invalid Python syntax"}

        analysis = {
            "has_loops": False,
            "has_conditionals": False,
            "has_functions": False,
            "variables": [],
        }

        for node in ast.walk(tree):
            if isinstance(node, (ast.For, ast.While)):
                analysis["has_loops"] = True
            elif isinstance(node, ast.If):
                analysis["has_conditionals"] = True
            elif isinstance(node, ast.FunctionDef):
                analysis["has_functions"] = True
            elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                if node.id not in analysis["variables"]:
                    analysis["variables"].append(node.id)

        return analysis

