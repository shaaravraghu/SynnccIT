# # from .parser_engine import analyze_python_function
# # from .sandbox_runner import run_python_sandbox

# # def generate_testcases(code: str):
# #     info = analyze_python_function(code)
# #     if info is None:
# #         return []

# #     params = info["params"]
# #     param_count = len(params)

# #     SEEDS = {
# #         0: [[]],
# #         1: [[5], [0], [-3]],
# #         2: [[2, 5], [10, 5], [-1, 4]],
# #         3: [[1, 2, 3], [5, 5, 5], [-1, -2, -3]],
# #     }

# #     seeds = SEEDS.get(param_count, SEEDS[2])

# #     testcases = []

# #     for s in seeds:
# #         inp_strings = [str(x) for x in s]

# #         # v2.0 core functionality — executes actual user code
# #         output = run_python_sandbox(code, inp_strings)

# #         expected = "ERROR" if "ERROR" in output else output.strip()

# #         testcases.append({
# #             "input": inp_strings,
# #             "expected": expected
# #         })

# #     return testcases
# import random
# from .sandbox_runner import run_python_sandbox
# from .parser_engine import ParserEngine

# def guess_test_inputs(var_count):
#     if var_count == 0:
#         return [[]]

#     seeds = []
#     for _ in range(5):
#         seeds.append([random.randint(-10, 20) for __ in range(var_count)])

#     return seeds


# def generate_testcases(code: str):

#     analysis = ParserEngine.analyze(code)

#     var_count = len(analysis.variables)

#     input_sets = guess_test_inputs(var_count)

#     testcases = []

#     for idx, inputs in enumerate(input_sets):
#         inputs_str = [str(i) for i in inputs]

#         # expected = golden run
#         expected_run = run_python_sandbox(code, inputs_str)

#         # actual = runtime
#         actual_run = run_python_sandbox(code, inputs_str)

#         expected = expected_run["stdout"]
#         actual = actual_run["stdout"]

#         status = "PASS" if expected == actual else "FAIL"

#         testcases.append({
#             "testcase_id": idx + 1,
#             "input": inputs_str,
#             "expected_output": expected,
#             "actual_output": actual,
#             "execution_time_ms": actual_run["time_ms"],
#             "memory_used_kb": actual_run["memory_kb"],
#             "status": status
#         })

#     return testcases
# backend/services/testcase_generator.py

from backend.services.parser_engine import ParserEngine

from .sandbox_runner import run_python_sandbox

# -------------------------------------------------------------
# STATIC EVALUATOR — Predict expected output WITHOUT execution
# -------------------------------------------------------------
def static_evaluate(func_info, inputs):
    """
    Predict expected output by simulating simple Python logic:
    - arithmetic
    - conditions
    - loops
    - string operations
    - return statement
    """

    # Only supports function-based code for prediction
    if func_info["type"] != "function":
        return "STATIC_EVAL_NOT_SUPPORTED"

    params = func_info["params"]
    body = func_info["body_ast"]

    # Create a local environment mapping param → input
    env = {}
    for i, p in enumerate(params):
        env[p] = eval(inputs[i])  # convert "5" to 5

    # --- VERY SIMPLE STATIC INTERPRETER ---
    # Supports: assignments, return, if, while, for

    def eval_expr(expr):
        if isinstance(expr, ast.BinOp):
            left = eval_expr(expr.left)
            right = eval_expr(expr.right)

            if isinstance(expr.op, ast.Add): return left + right
            if isinstance(expr.op, ast.Sub): return left - right
            if isinstance(expr.op, ast.Mult): return left * right
            if isinstance(expr.op, ast.Div): return left / right
            if isinstance(expr.op, ast.Mod): return left % right

        elif isinstance(expr, ast.Name):
            return env[expr.id]

        elif isinstance(expr, ast.Constant):
            return expr.value

        elif isinstance(expr, ast.Compare):
            left = eval_expr(expr.left)
            right = eval_expr(expr.comparators[0])
            op = expr.ops[0]

            if isinstance(op, ast.Lt): return left < right
            if isinstance(op, ast.Gt): return left > right
            if isinstance(op, ast.Eq): return left == right

        return None

    import ast

    for stmt in body:

        # x = something
        if isinstance(stmt, ast.Assign):
            target = stmt.targets[0].id
            env[target] = eval_expr(stmt.value)

        # if condition:
        elif isinstance(stmt, ast.If):
            cond = eval_expr(stmt.test)
            if cond:
                for s in stmt.body:
                    if isinstance(s, ast.Return):
                        return eval_expr(s.value)
            else:
                for s in stmt.orelse:
                    if isinstance(s, ast.Return):
                        return eval_expr(s.value)

        # return
        elif isinstance(stmt, ast.Return):
            return eval_expr(stmt.value)

    return "STATIC_EVAL_NOT_SUPPORTED"


# -------------------------------------------------------------
# TESTCASE GENERATOR
# -------------------------------------------------------------
def generate_testcases(code: str):
    import ast

    info = ParserEngine.analyze_python(code)

    if info is None:
        return []
    info = ParserEngine.analyze_javascript(code)


    params = info["params"]
    param_count = len(params)

    # Better seeds
    SEEDS = {
        0: [[]],
        1: [["5"], ["0"], ["-3"]],
        2: [["2", "5"], ["10", "5"], ["-1", "4"]],
        3: [["1", "2", "3"], ["5", "5", "5"], ["-1", "-2", "-3"]],
    }

    seeds = SEEDS.get(param_count, SEEDS[2])

    testcases = []

    for s in seeds:
        # ---- Expected output (static analysis, NO execution) ----
        try:
            expected = static_evaluate(info, s)
        except:
            expected = "STATIC_EVAL_NOT_SUPPORTED"

        # ---- Actual output (run sandbox) ----
        actual = run_python_sandbox(code, s).strip()

        status = "PASS" if str(expected) == str(actual) else "FAIL"

        testcases.append({
            "input": s,
            "expected": str(expected),
            "actual": actual,
            "status": status
        })

    return testcases
