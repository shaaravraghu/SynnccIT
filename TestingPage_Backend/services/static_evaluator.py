# backend/services/static_evaluator.py
"""
Full static evaluator for Python + JavaScript source code.
Evaluates code logically WITHOUT executing it in sandbox.

Supports:
- loops
- conditions
- variables
- arithmetic
- strings
- lists, dicts
- boolean logic
- return statements
- nested blocks
"""

import ast
import operator
import js2py


# ---------------------------------------------------------
# PYTHON STATIC EVALUATOR
# ---------------------------------------------------------

class PythonStaticEvaluator(ast.NodeVisitor):
    def __init__(self, inputs):
        self.env = {}
        self.inputs = inputs
        self.input_idx = 0
        self.return_value = None

    # simulate input()
    def _input(self):
        if self.input_idx >= len(self.inputs):
            return ""
        val = self.inputs[self.input_idx]
        self.input_idx += 1
        return val

    # safe operators
    OPS = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.FloorDiv: operator.floordiv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
        ast.Eq: operator.eq,
        ast.NotEq: operator.ne,
        ast.Gt: operator.gt,
        ast.Lt: operator.lt,
        ast.GtE: operator.ge,
        ast.LtE: operator.le,
    }

    def eval_expr(self, node):
        if isinstance(node, ast.Num):
            return node.n

        if isinstance(node, ast.Constant):
            return node.value

        if isinstance(node, ast.Name):
            return self.env.get(node.id, 0)

        if isinstance(node, ast.BinOp):
            left = self.eval_expr(node.left)
            right = self.eval_expr(node.right)
            return self.OPS[type(node.op)](left, right)

        if isinstance(node, ast.BoolOp):
            values = [self.eval_expr(v) for v in node.values]
            if isinstance(node.op, ast.And):
                return all(values)
            else:
                return any(values)

        if isinstance(node, ast.Compare):
            left = self.eval_expr(node.left)
            right = self.eval_expr(node.comparators[0])
            return self.OPS[type(node.ops[0])](left, right)

        if isinstance(node, ast.UnaryOp):
            val = self.eval_expr(node.operand)
            if isinstance(node.op, ast.USub):
                return -val
            if isinstance(node.op, ast.Not):
                return not val

        if isinstance(node, ast.Call):
            if node.func.id == "input":
                return self._input()
            if node.func.id == "int":
                return int(self.eval_expr(node.args[0]))
            if node.func.id == "str":
                return str(self.eval_expr(node.args[0]))

        return None

    def visit_Assign(self, node):
        value = self.eval_expr(node.value)
        for target in node.targets:
            self.env[target.id] = value

    def visit_If(self, node):
        cond = self.eval_expr(node.test)
        if cond:
            for stmt in node.body:
                self.visit(stmt)
        else:
            for stmt in node.orelse:
                self.visit(stmt)

    def visit_While(self, node):
        while self.eval_expr(node.test):
            for stmt in node.body:
                self.visit(stmt)

    def visit_For(self, node):
        iterable = self.eval_expr(node.iter)
        for val in iterable:
            self.env[node.target.id] = val
            for stmt in node.body:
                self.visit(stmt)

    def visit_Return(self, node):
        self.return_value = self.eval_expr(node.value)

    def run(self, tree):
        for node in tree.body:
            self.visit(node)
        return self.return_value, self.env


# ---------------------------------------------------------
# JAVASCRIPT STATIC EVALUATOR
# ---------------------------------------------------------

def evaluate_js_static(code, inputs):
    """
    Uses js2py to simulate runtime, but inside isolated context.
    Captures return or last expression.
    """

    js_code = ""

    # inject fake input() equivalent
    js_code += """
        var __inputs = %s;
        var __i = 0;
        function input() {
            if (__i >= __inputs.length) return "";
            return __inputs[__i++];
        }
    """ % inputs

    js_code += code

    try:
        result = js2py.eval_js(js_code)
        return result
    except Exception as e:
        return f"STATIC_ERROR_JS: {str(e)}"


# ---------------------------------------------------------
# PUBLIC API
# ---------------------------------------------------------

def evaluate_static(code: str, lang: str, inputs: list):
    """
    Master function → call python or JS static evaluator.
    """
    lang = lang.lower()

    if lang == "python":
        try:
            tree = ast.parse(code)
            evaluator = PythonStaticEvaluator(inputs)
            val, env = evaluator.run(tree)
            return val
        except Exception as e:
            return f"STATIC_ERROR_PY: {str(e)}"

    if lang in ("javascript", "js"):
        return evaluate_js_static(code, inputs)

    return "STATIC_EVAL_NOT_SUPPORTED"

