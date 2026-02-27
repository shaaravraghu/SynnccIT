class ParserEngine:
    """Universal parser engine for C, Python, JavaScript"""

    def parse(self, code: str, language: str):
        language = language.lower()

        if language == "c":
            return self.parse_c(code)
        elif language == "python":
            return self.parse_python(code)
        elif language == "javascript":
            return self.parse_js(code)

        raise ValueError(f"Unsupported language: {language}")

    # ---------------------- C PARSER ----------------------------
    def parse_c(self, code: str):
        return {
            "variables": self.extract_variables(code),
            "loops": self.extract_loops(code),
            "conditions": self.extract_conditions(code),
        }

    # ---------------------- PYTHON PARSER -----------------------
    def parse_python(self, code: str):
        import ast
        tree = ast.parse(code)

        return {
            "variables": [n.id for n in ast.walk(tree) if isinstance(n, ast.Name)],
            "loops": [type(n).__name__ for n in ast.walk(tree) if isinstance(n, (ast.For, ast.While))],
            "conditions": [type(n).__name__ for n in ast.walk(tree) if isinstance(n, ast.If)],
        }

    # ---------------------- JS PARSER ---------------------------
    def parse_js(self, code: str):
        import re

        return {
            "variables": re.findall(r"let\s+(\w+)|var\s+(\w+)|const\s+(\w+)", code),
            "loops": re.findall(r"(for|while)\s*\(", code),
            "conditions": re.findall(r"if\s*\(", code),
        }

    # ---------------------- SHARED UTILITIES --------------------
    def extract_variables(self, code: str):
        import re
        return re.findall(r"(int|float|char)\s+(\w+)", code)

    def extract_loops(self, code: str):
        import re
        return re.findall(r"(for|while)\s*\(", code)

    def extract_conditions(self, code: str):
        import re
        return re.findall(r"if\s*\(", code)
