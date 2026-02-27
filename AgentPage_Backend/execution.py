# import subprocess
# import tempfile

# def execute_python_code(code: str):
#     with tempfile.NamedTemporaryFile(
#         suffix=".py",
#         mode="w",
#         delete=False
#     ) as temp_file:
#         temp_file.write(code)
#         file_path = temp_file.name

#     try:
#         result = subprocess.run(
#             ["python3", file_path],
#             capture_output=True,
#             text=True,
#             timeout=5
#         )
#         return {
#             # "stdout": result.stdout,
#             # "stderr": result.stderr
            
#         }
#     except subprocess.TimeoutExpired:
#         return {
#             "stdout": "",
#             "stderr": "Execution timed out"
#         }
import os
import subprocess
import tempfile
import os

def execute_python_code(code: str):
    with tempfile.NamedTemporaryFile(
        suffix=".py",
        mode="w",
        delete=False
    ) as temp_file:
        temp_file.write(code)
        file_path = temp_file.name

    try:
        result = subprocess.run(
            ["python3", file_path],
            capture_output=True,
            text=True,
            timeout=5
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr
        }

    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Execution timed out"
        }

    finally:
        os.remove(file_path)
