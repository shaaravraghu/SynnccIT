"""
Code Executor Service
Executes Python code safely and returns output
"""

import subprocess
import tempfile
import os
import sys
from typing import Dict, Any, List


class CodeExecutor:
    """Execute Python code safely and capture output"""

    def execute_python(self, code: str, input_data: str = "", timeout: int = 5) -> Dict[str, Any]:
        """
        Execute Python code and return output
        
        Args:
            code: Python code to execute
            input_data: Input data as string (lines separated by \n)
            timeout: Timeout in seconds
            
        Returns:
            Dictionary with stdout, stderr, runtime, memory
        """
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                file_path = os.path.join(tmpdir, "run.py")

                with open(file_path, "w") as f:
                    f.write(code)

                try:
                    import time
                    start = time.time()

                    result = subprocess.run(
                        [sys.executable, file_path],
                        input=input_data.encode() if input_data else None,
                        capture_output=True,
                        timeout=timeout,
                        text=False,
                    )

                    end = time.time()

                    stdout = result.stdout.decode("utf-8", errors="replace")
                    stderr = result.stderr.decode("utf-8", errors="replace")

                    return {
                        "output": stdout,
                        "error": stderr,
                        "runtime": round(end - start, 4),
                        "success": result.returncode == 0,
                    }

                except subprocess.TimeoutExpired:
                    return {
                        "output": "",
                        "error": "Execution timed out (exceeded 5 seconds)",
                        "runtime": timeout,
                        "success": False,
                    }
                except Exception as e:
                    return {
                        "output": "",
                        "error": str(e),
                        "runtime": 0,
                        "success": False,
                    }

        except Exception as e:
            return {
                "output": "",
                "error": f"Setup error: {str(e)}",
                "runtime": 0,
                "success": False,
            }

    def execute_with_testcases(
        self, code: str, testcases: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """
        Execute code with multiple test cases
        
        Args:
            code: Python code to execute
            testcases: List of test cases with 'input' field
            
        Returns:
            List of results with input and actual output
        """
        results = []

        for tc in testcases:
            input_data = tc.get("input", "")
            result = self.execute_python(code, input_data)

            results.append({
                "input": input_data,
                "actual": result["output"].strip(),
                "error": result["error"],
                "expected": tc.get("expected", ""),
                "runtime": result["runtime"],
            })

        return results
