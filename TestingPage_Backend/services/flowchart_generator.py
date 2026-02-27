"""
Flowchart Generator Service
Parses code and generates flowchart diagrams using graphviz
"""

import ast
from typing import Dict, List, Any, Tuple
import re


class FlowchartGenerator:
    """Generate flowcharts from code"""

    def parse_code_to_flowchart(self, code: str) -> List[Dict[str, str]]:
        """
        Parse Python code and convert to flowchart steps
        
        Returns list of steps with type and description
        """
        try:
            tree = ast.parse(code)
        except SyntaxError:
            return [
                {"type": "start", "text": "Start"},
                {"type": "process", "text": "Invalid Syntax"},
                {"type": "end", "text": "End"},
            ]

        steps = []
        steps.append({"type": "start", "text": "Start"})

        # Extract main statements
        for node in tree.body:
            steps.extend(self._parse_node(node))

        steps.append({"type": "end", "text": "End"})
        return steps

    def _parse_node(self, node: ast.AST) -> List[Dict[str, str]]:
        """Parse AST node and return flowchart steps"""
        steps = []

        if isinstance(node, ast.Assign):
            # Variable assignment
            var_names = self._get_target_names(node.targets[0])
            steps.append({
                "type": "process",
                "text": f"Assign: {var_names}",
            })

        elif isinstance(node, ast.Expr):
            # Expression (print, function calls)
            expr = node.value
            if isinstance(expr, ast.Call):
                func_name = self._get_func_name(expr.func)
                if func_name == "print":
                    steps.append({
                        "type": "io",
                        "text": "Print Output",
                    })
                else:
                    steps.append({
                        "type": "process",
                        "text": f"Call: {func_name}()",
                    })
            else:
                steps.append({
                    "type": "process",
                    "text": "Expression",
                })

        elif isinstance(node, ast.If):
            # Conditional
            steps.append({
                "type": "decision",
                "text": "Condition?",
            })
            steps.extend([{"type": "process", "text": "If Block"}])
            if node.orelse:
                steps.extend([{"type": "process", "text": "Else Block"}])

        elif isinstance(node, ast.For):
            # For loop
            loop_var = node.target.id if isinstance(node.target, ast.Name) else "i"
            steps.append({
                "type": "decision",
                "text": f"For {loop_var}?",
            })
            steps.append({
                "type": "process",
                "text": "Loop Body",
            })

        elif isinstance(node, ast.While):
            # While loop
            steps.append({
                "type": "decision",
                "text": "While Condition?",
            })
            steps.append({
                "type": "process",
                "text": "Loop Body",
            })

        elif isinstance(node, ast.FunctionDef):
            # Function definition
            steps.append({
                "type": "process",
                "text": f"Define: {node.name}()",
            })

        elif isinstance(node, ast.Return):
            # Return statement
            steps.append({
                "type": "process",
                "text": "Return",
            })

        else:
            # Generic statement
            steps.append({
                "type": "process",
                "text": type(node).__name__,
            })

        return steps

    def _get_target_names(self, node: ast.AST) -> str:
        """Get variable names from assignment target"""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Tuple):
            return ", ".join(self._get_target_names(elt) for elt in node.elts)
        return "var"

    def _get_func_name(self, node: ast.AST) -> str:
        """Get function name from call node"""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return node.attr
        return "func"

    def generate_ascii_flowchart(self, code: str) -> str:
        """Generate ASCII art flowchart"""
        steps = self.parse_code_to_flowchart(code)
        
        ascii_chart = ""
        for i, step in enumerate(steps):
            step_type = step.get("type", "process")
            text = step.get("text", "")

            if step_type == "start" or step_type == "end":
                ascii_chart += f"   [*{text}*]\n"
            elif step_type == "decision":
                ascii_chart += f"    <{text}>\n"
            elif step_type == "io":
                ascii_chart += f"   /{text}/\n"
            else:  # process
                ascii_chart += f"  |{text:^20}|\n"

            if i < len(steps) - 1:
                ascii_chart += "       |\n"
                ascii_chart += "       v\n"

        return ascii_chart

    def generate_graphviz_code(self, code: str) -> str:
        """Generate Graphviz DOT code for flowchart"""
        steps = self.parse_code_to_flowchart(code)

        dot = "digraph Flowchart {\n"
        dot += "  rankdir=TB;\n"
        dot += "  node [shape=box, style=rounded];\n"

        for i, step in enumerate(steps):
            node_id = f"node{i}"
            step_type = step.get("type", "process")
            text = step.get("text", "").replace('"', '\\"')

            if step_type == "start" or step_type == "end":
                dot += f'  {node_id} [shape=ellipse, label="{text}"];\n'
            elif step_type == "decision":
                dot += f'  {node_id} [shape=diamond, label="{text}"];\n'
            elif step_type == "io":
                dot += f'  {node_id} [shape=parallelogram, label="{text}"];\n'
            else:  # process
                dot += f'  {node_id} [shape=box, label="{text}"];\n'

        # Add edges
        for i in range(len(steps) - 1):
            dot += f"  node{i} -> node{i+1};\n"

        dot += "}\n"
        return dot
