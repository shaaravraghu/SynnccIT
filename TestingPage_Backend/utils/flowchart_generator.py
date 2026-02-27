"""
Graphviz-based flowchart generator.


IMPORTANT:
- Heavy imports are inside the function to avoid freezing startup.
- Returns raw SVG bytes (not base64). The router returns it as image/svg+xml.
"""

from typing import Iterable
import os

os.environ["PATH"] += os.pathsep + r"C:\Program Files\Graphviz\bin"



def generate_flowchart(code_text: str) -> bytes:
    """
    Generate a simple top-to-bottom flowchart from code/text.

    - Splits input into non-empty lines
    - Each line becomes a node
    - Adds sequential edges

    Returns:
        Raw SVG bytes (Graphviz pipe output).
    """
    # Heavy import moved inside function (startup must be instant)
    from graphviz import Digraph

    graph = Digraph(format="svg")
    graph.attr(rankdir="TB")

    steps = [line.strip() for line in (code_text or "").split("\n") if line.strip()]

    # If empty, render a minimal diagram so frontend always gets valid SVG.
    if not steps:
        steps = ["No steps (empty input)"]

    for i, step in enumerate(steps):
        graph.node(str(i), step)
        if i > 0:
            graph.edge(str(i - 1), str(i))

    try:
        return graph.pipe()
    except Exception as e:
        # Most common on Windows: Graphviz system binaries (dot) not installed / not on PATH.
        # Return a valid SVG containing the error so the frontend can still render something.
        msg = str(e).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        fallback_svg = f"""<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="120">
  <rect x="0" y="0" width="900" height="120" fill="#fff5f5" stroke="#fecaca"/>
  <text x="18" y="40" font-family="Arial, sans-serif" font-size="16" fill="#991b1b">
    Flowchart generation error
  </text>
  <text x="18" y="72" font-family="Consolas, monospace" font-size="12" fill="#7f1d1d">
    {msg[:160]}
  </text>
  <text x="18" y="98" font-family="Arial, sans-serif" font-size="12" fill="#7f1d1d">
    Install Graphviz and add 'dot' to PATH to enable rendering.
  </text>
</svg>
"""
        return fallback_svg.encode("utf-8")
