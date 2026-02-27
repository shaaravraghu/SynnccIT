# from fastapi import APIRouter
# from pydantic import BaseModel

# router = APIRouter(prefix="/flowchart", tags=["Flowchart"])

# class FlowRequest(BaseModel):
#     code: str

# @router.post("/generate")
# async def generate_flowchart(req: FlowRequest):
#     # TODO: Replace with your parser / logic
#     # Temporary mock response
#     return {
#         "flowchart": [
#             {"step": "Start"},
#             {"step": "Read Variables"},
#             {"step": "Execute Code"},
#             {"step": "End"}
#         ]
#     }
# backend/routers/flowchart_router.py

# from fastapi import APIRouter
# from pydantic import BaseModel
# import sys
# from pathlib import Path
# import matplotlib.pyplot as plt
# import matplotlib.patches as patches
# import io
# import base64

# # Add backend directory to path
# _backend_dir = Path(__file__).parent.parent
# if str(_backend_dir) not in sys.path:
#     sys.path.insert(0, str(_backend_dir))

# from services.flowchart_generator import FlowchartGenerator

# flowchart_router = APIRouter()

# class FlowchartRequest(BaseModel):
#     code: str

# # Initialize generator
# flowchart_gen = FlowchartGenerator()

# @flowchart_router.post("/generate")
# def generate_flowchart(req: FlowchartRequest):
#     """Generate flowchart from code with proper symbols"""
#     try:
#         # Parse code to get flowchart steps
#         steps = flowchart_gen.parse_code_to_flowchart(req.code)
        
#         # Generate visual flowchart
#         fig, ax = plt.subplots(figsize=(8, max(5, len(steps) * 0.8)))
#         ax.set_xlim(0, 10)
#         ax.set_ylim(0, len(steps) * 1.5 + 2)
#         ax.axis("off")
        
#         y_pos = len(steps) * 1.5
        
#         # Shape definitions
#         for step in steps:
#             step_type = step.get("type", "process")
#             text = step.get("text", "")
            
#             if step_type == "start" or step_type == "end":
#                 # Oval shape
#                 oval = patches.Ellipse(
#                     (5, y_pos), 2, 0.6, 
#                     edgecolor="black", 
#                     facecolor="lightblue", 
#                     linewidth=2
#                 )
#                 ax.add_patch(oval)
#                 ax.text(5, y_pos, text, ha="center", va="center", fontsize=10, weight="bold")
                
#             elif step_type == "decision":
#                 # Diamond shape
#                 diamond = patches.Polygon(
#                     [(5, y_pos + 0.5), (6, y_pos), (5, y_pos - 0.5), (4, y_pos)],
#                     edgecolor="black",
#                     facecolor="lightyellow",
#                     linewidth=2
#                 )
#                 ax.add_patch(diamond)
#                 ax.text(5, y_pos, text, ha="center", va="center", fontsize=9, weight="bold")
                
#             elif step_type == "io":
#                 # Parallelogram shape
#                 parallelogram = patches.Polygon(
#                     [(4.3, y_pos + 0.4), (5.7, y_pos + 0.4), (5.9, y_pos - 0.4), (4.1, y_pos - 0.4)],
#                     edgecolor="black",
#                     facecolor="lightgreen",
#                     linewidth=2
#                 )
#                 ax.add_patch(parallelogram)
#                 ax.text(5, y_pos, text, ha="center", va="center", fontsize=9, weight="bold")
                
#             else:  # process
#                 # Rectangle shape
#                 rect = patches.Rectangle(
#                     (4, y_pos - 0.4), 2, 0.8,
#                     edgecolor="black",
#                     facecolor="lightcoral",
#                     linewidth=2
#                 )
#                 ax.add_patch(rect)
#                 ax.text(5, y_pos, text, ha="center", va="center", fontsize=9, weight="bold")
            
#             # Draw arrow to next step
#             if steps.index(step) < len(steps) - 1:
#                 ax.arrow(5, y_pos - 0.6, 0, -0.3, head_width=0.15, head_length=0.1, fc="black", ec="black")
            
#             y_pos -= 1.5
        
#         # Convert to base64
#         buffer = io.BytesIO()
#         plt.savefig(buffer, format="png", bbox_inches="tight", dpi=100)
#         plt.close(fig)
#         buffer.seek(0)
#         img_str = base64.b64encode(buffer.read()).decode()
        
#         return {"image": img_str}
        
#     except Exception as e:
#         # Fallback: return error message as image
#         fig, ax = plt.subplots(figsize=(6, 3))
#         ax.text(0.5, 0.5, f"Error: {str(e)}", ha="center", va="center", fontsize=10)
#         ax.axis("off")
        
#         buffer = io.BytesIO()
#         plt.savefig(buffer, format="png", bbox_inches="tight")
#         plt.close(fig)
#         buffer.seek(0)
#         img_str = base64.b64encode(buffer.read()).decode()
        
#         return {"image": img_str}

# File: backend/routers/flowchart_router.py
# Flowchart Generation Router

# from fastapi import APIRouter
# from pydantic import BaseModel
# import sys
# from pathlib import Path

# # Add backend directory to path
# _backend_dir = Path(__file__).parent.parent
# if str(_backend_dir) not in sys.path:
#     sys.path.insert(0, str(_backend_dir))

# from services.flowchart_generator import FlowchartGenerator

# flowchart_router = APIRouter()

# class FlowchartRequest(BaseModel):
#     code: str

# # Initialize generator
# flowchart_gen = FlowchartGenerator()

# @flowchart_router.post("/generate")
# def generate_flowchart(req: FlowchartRequest):
#     """Generate flowchart from code"""
#     try:
#         flowchart_svg = flowchart_gen.generate(req.code)
#         return {"flowchart": flowchart_svg}
#     except Exception as e:
#         return {"error": str(e), "flowchart": ""}

# File: backend/routers/flowchart_router.py
# FIXED - Proper flowchart generation

from fastapi import APIRouter
from pydantic import BaseModel
import sys
from pathlib import Path

# Add backend directory to path
_backend_dir = Path(__file__).parent.parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from services.flowchart_generator import FlowchartGenerator

flowchart_router = APIRouter()

class FlowchartRequest(BaseModel):
    code: str

# Initialize generator
flowchart_gen = FlowchartGenerator()

def create_simple_svg_flowchart(steps: list) -> str:
    """Create a simple SVG from flowchart steps"""
    svg_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg width="400" height="{}" xmlns="http://www.w3.org/2000/svg">'.format(len(steps) * 100 + 100),
        '<style>',
        '.start-end { fill: #87CEEB; stroke: black; stroke-width: 2; }',
        '.process { fill: #FFB6C1; stroke: black; stroke-width: 2; }',
        '.decision { fill: #FFFFE0; stroke: black; stroke-width: 2; }',
        '.io { fill: #90EE90; stroke: black; stroke-width: 2; }',
        '.text { font-family: Arial; font-size: 12px; text-anchor: middle; }',
        '.arrow { stroke: black; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }',
        '</style>',
        '<defs>',
        '<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">',
        '<polygon points="0 0, 10 3, 0 6" fill="black" />',
        '</marker>',
        '</defs>',
    ]
    
    y_pos = 30
    
    for step in steps:
        step_type = step.get("type", "process")
        text = step.get("text", "")
        
        if step_type == "start" or step_type == "end":
            # Oval shape
            svg_parts.append(
                f'<ellipse cx="200" cy="{y_pos}" rx="60" ry="25" class="start-end"/>'
            )
        elif step_type == "decision":
            # Diamond shape
            svg_parts.append(
                f'<polygon points="200,{y_pos-30} 280,{y_pos} 200,{y_pos+30} 120,{y_pos}" class="decision"/>'
            )
        elif step_type == "io":
            # Parallelogram shape
            svg_parts.append(
                f'<polygon points="150,{y_pos-20} 250,{y_pos-20} 260,{y_pos+20} 140,{y_pos+20}" class="io"/>'
            )
        else:  # process
            # Rectangle shape
            svg_parts.append(
                f'<rect x="150" y="{y_pos-20}" width="100" height="40" class="process"/>'
            )
        
        # Add text
        svg_parts.append(f'<text x="200" y="{y_pos+5}" class="text">{text}</text>')
        
        # Add arrow to next step (if not last)
        if steps.index(step) < len(steps) - 1:
            svg_parts.append(f'<line x1="200" y1="{y_pos+40}" x2="200" y2="{y_pos+60}" class="arrow"/>')
        
        y_pos += 100
    
    svg_parts.append('</svg>')
    return '\n'.join(svg_parts)

@flowchart_router.post("/generate")
def generate_flowchart(req: FlowchartRequest):
    """Generate flowchart from code"""
    try:
        # Parse code to get flowchart steps
        steps = flowchart_gen.parse_code_to_flowchart(req.code)
        
        # Generate SVG
        svg_content = create_simple_svg_flowchart(steps)
        
        return {
            "flowchart": svg_content,
            "steps": steps,
            "error": None
        }
    except Exception as e:
        error_message = str(e)
        print(f"Flowchart generation error: {error_message}")
        
        # Return error response
        return {
            "flowchart": None,
            "steps": [],
            "error": f"Failed to generate flowchart: {error_message}"
        }