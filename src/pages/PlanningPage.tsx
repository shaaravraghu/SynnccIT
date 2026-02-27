import { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, Line, IText, FabricObject } from 'fabric';
import {
  MousePointer2,
  Square,
  Circle as CircleIcon,
  Type,
  Minus,
  Undo,
  Redo,
  Download,
  Trash2,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tools = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: CircleIcon },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'line', label: 'Line', icon: Minus },
];

const colors = [
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#e2e8f0',
  '#64748b',
];

export default function PlanningPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState('select');
  const [activeColor, setActiveColor] = useState(colors[0]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Drawing state
  const isDrawing = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });
  const currentShape = useRef<FabricObject | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#0f1419',
      selection: true,
    });

    setFabricCanvas(canvas);
    saveToHistory(canvas);

    const handleResize = () => {
      canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Set up drawing event handlers
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      if (activeTool === 'select') return;
      
      const pointer = fabricCanvas.getViewportPoint(opt.e);
      isDrawing.current = true;
      startPoint.current = { x: pointer.x, y: pointer.y };

      // Disable selection while drawing
      fabricCanvas.selection = false;
      fabricCanvas.forEachObject((obj) => { obj.selectable = false; });

      if (activeTool === 'rectangle') {
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: activeColor + '20',
          stroke: activeColor,
          strokeWidth: 2,
          rx: 8,
          ry: 8,
        });
        fabricCanvas.add(rect);
        currentShape.current = rect;
      } else if (activeTool === 'circle') {
        const circle = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: activeColor + '20',
          stroke: activeColor,
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        });
        fabricCanvas.add(circle);
        currentShape.current = circle;
      } else if (activeTool === 'line') {
        const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: activeColor,
          strokeWidth: 2,
        });
        fabricCanvas.add(line);
        currentShape.current = line;
      } else if (activeTool === 'text') {
        const text = new IText('Text', {
          left: pointer.x,
          top: pointer.y,
          fill: activeColor,
          fontSize: 18,
          fontFamily: 'Inter, sans-serif',
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        text.enterEditing();
        saveToHistory(fabricCanvas);
        setActiveTool('select');
        isDrawing.current = false;
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!isDrawing.current || !currentShape.current) return;
      
      const pointer = fabricCanvas.getViewportPoint(opt.e);
      const shape = currentShape.current;

      if (activeTool === 'rectangle') {
        const width = pointer.x - startPoint.current.x;
        const height = pointer.y - startPoint.current.y;
        
        shape.set({
          left: width > 0 ? startPoint.current.x : pointer.x,
          top: height > 0 ? startPoint.current.y : pointer.y,
          width: Math.abs(width),
          height: Math.abs(height),
        });
      } else if (activeTool === 'circle') {
        const dx = pointer.x - startPoint.current.x;
        const dy = pointer.y - startPoint.current.y;
        const radius = Math.sqrt(dx * dx + dy * dy) / 2;
        
        (shape as Circle).set({
          left: startPoint.current.x + dx / 2,
          top: startPoint.current.y + dy / 2,
          radius: radius,
        });
      } else if (activeTool === 'line') {
        (shape as Line).set({
          x2: pointer.x,
          y2: pointer.y,
        });
      }

      fabricCanvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isDrawing.current) return;
      
      isDrawing.current = false;
      
      if (currentShape.current) {
        // Remove shapes that are too small (accidental clicks)
        const shape = currentShape.current;
        let isTooSmall = false;
        
        if (shape.type === 'rect') {
          isTooSmall = (shape as Rect).width! < 5 && (shape as Rect).height! < 5;
        } else if (shape.type === 'circle') {
          isTooSmall = (shape as Circle).radius! < 5;
        } else if (shape.type === 'line') {
          const line = shape as Line;
          const dx = line.x2! - line.x1!;
          const dy = line.y2! - line.y1!;
          isTooSmall = Math.sqrt(dx * dx + dy * dy) < 5;
        }

        if (isTooSmall) {
          fabricCanvas.remove(shape);
        } else {
          fabricCanvas.setActiveObject(shape);
          saveToHistory(fabricCanvas);
        }
        
        currentShape.current = null;
      }

      // Re-enable selection
      fabricCanvas.selection = true;
      fabricCanvas.forEachObject((obj) => { obj.selectable = true; });
      setActiveTool('select');
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
    };
  }, [fabricCanvas, activeTool, activeColor]);

  // Update selection mode
  useEffect(() => {
    if (!fabricCanvas) return;
    const isSelectMode = activeTool === 'select';
    fabricCanvas.selection = isSelectMode;
    fabricCanvas.forEachObject((obj) => { obj.selectable = isSelectMode; });
    fabricCanvas.defaultCursor = isSelectMode ? 'default' : 'crosshair';
    fabricCanvas.renderAll();
  }, [activeTool, fabricCanvas]);

  const saveToHistory = (canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => [...prev.slice(0, historyIndex + 1), json]);
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || !fabricCanvas) return;
    const newIndex = historyIndex - 1;
    fabricCanvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1 || !fabricCanvas) return;
    const newIndex = historyIndex + 1;
    fabricCanvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });
    const link = document.createElement('a');
    link.download = 'planning-whiteboard.png';
    link.href = dataURL;
    link.click();
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#0f1419';
    fabricCanvas.renderAll();
    saveToHistory(fabricCanvas);
  };

  const handleColorChange = (color: string) => {
    setActiveColor(color);
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'i-text') {
        activeObject.set('fill', color);
      } else {
        activeObject.set('stroke', color);
        activeObject.set('fill', color + '20');
      }
      fabricCanvas.renderAll();
      saveToHistory(fabricCanvas);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="h-12 flex items-center justify-between px-4 bg-secondary/30 border-b border-border">
        <span className="text-sm font-medium">Planning Whiteboard</span>
        
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setActiveTool(tool.id)}
                title={tool.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="w-14 bg-card border-r border-border flex flex-col items-center py-4 gap-4">
          <Palette className="h-4 w-4 text-muted-foreground mb-1" />
          {colors.map((color, i) => (
            <button
              key={i}
              onClick={() => handleColorChange(color)}
              className={cn(
                'w-6 h-6 rounded-full transition-transform',
                activeColor === color && 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div ref={containerRef} className="flex-1 overflow-hidden relative">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
