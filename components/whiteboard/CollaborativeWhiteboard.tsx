"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "../../hooks/use-toast";
import { useWhiteboardWebSocket } from "@/hooks/use-whiteboard-websocket";
import {
  Pen,
  Square,
  Circle,
  ArrowRight,
  Type,
  Image,
  StickyNote,
  Eraser,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Wifi,
  Move,
  Palette,
  Settings,
  Users,
  Share2,
  Save,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Hand,
  MousePointer,
  Minus,
  Plus,
  RotateCcw,
  Grid3X3,
  Layers,
  Copy,
  XCircle,
  X
} from "lucide-react";

interface WhiteboardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
  data: any;
  version: number;
  isSelected?: boolean;
}

interface WhiteboardParticipant {
  id: string;
  userId: string;
  userName: string;
  cursorColor: string;
  cursorX?: number;
  cursorY?: number;
  isOnline: boolean;
  role: ParticipantRole;
}

type ElementType = 'Pen' | 'Line' | 'Rectangle' | 'Circle' | 'Arrow' | 'Text' | 'Image' | 'Sticky' | 'Shape' | 'Highlight' | 'Eraser';
type ParticipantRole = 'Owner' | 'Moderator' | 'Collaborator' | 'Viewer';
type Tool = ElementType | 'Select' | 'Pan';

interface CollaborativeWhiteboardProps {
  whiteboardId?: string;
  title?: string;
  width?: number;
  height?: number;
  isReadOnly?: boolean;
  showToolbar?: boolean;
  showParticipants?: boolean;
  onElementsChange?: (elements: WhiteboardElement[]) => void;
  onParticipantsChange?: (participants: WhiteboardParticipant[]) => void;
}

export function CollaborativeWhiteboard({
  whiteboardId,
  title = "Collaborative Whiteboard",
  width = 1920,
  height = 1080,
  isReadOnly = false,
  showToolbar = true,
  showParticipants = true,
  onElementsChange,
  onParticipantsChange
}: CollaborativeWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('Pen');
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set());
  const [participants, setParticipants] = useState<WhiteboardParticipant[]>([]);

  const {
    isConnected,
    sendCursorMove,
    sendElementAdd,
    sendElementUpdate,
    sendElementDelete,
    sendWhiteboardClear,
    setEventHandlers
  } = useWhiteboardWebSocket({ whiteboardId: whiteboardId || 'default' });

  // Handle real-time updates from WebSocket
  useEffect(() => {
    setEventHandlers({
      onElementAdd: (newElement: any) => {
        setElements(prev => {
          if (prev.some(el => el.id === newElement.id)) return prev;
          return [...prev, newElement];
        });
      },
      onElementUpdate: (elementId: string, updates: any) => {
        setElements(prev => prev.map(el =>
          el.id === elementId ? { ...el, ...updates } : el
        ));
      },
      onElementDelete: (elementId: string) => {
        setElements(prev => prev.filter(el => el.id !== elementId));
      },
      onWhiteboardClear: () => {
        setElements([]);
      }
    });
  }, [setEventHandlers]);

  // Drawing state
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(1);

  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

  // UI state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<WhiteboardElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Colors palette
  const colorPalette = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#ffc0cb', '#a52a2a', '#808080', '#000080', '#008000',
    '#ff69b4', '#ffd700', '#4b0082', '#dc143c', '#00ced1'
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  // Redraw canvas when elements change
  useEffect(() => {
    redrawCanvas();
    onElementsChange?.(elements);
  }, [elements, zoom, panX, panY, backgroundColor, showGrid]);

  // Handle participants change
  useEffect(() => {
    onParticipantsChange?.(participants);
  }, [participants]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx);
    }

    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panX / zoom, panY / zoom);

    // Draw all elements
    elements.forEach(element => {
      drawElement(ctx, element);
    });

    ctx.restore();

    // Draw participant cursors
    drawParticipantCursors(ctx);
  }, [elements, zoom, panX, panY, backgroundColor, showGrid, participants]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = 30; // Slightly larger grid for visibility
    ctx.strokeStyle = '#d1d5db'; // Slightly darker gray (gray-300) for better visibility
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    ctx.save();

    ctx.strokeStyle = element.strokeColor;
    ctx.fillStyle = element.fillColor || 'transparent';
    ctx.lineWidth = element.strokeWidth;
    ctx.globalAlpha = element.opacity;

    switch (element.type) {
      case 'Pen':
        drawPenStroke(ctx, element);
        break;
      case 'Line':
        drawLine(ctx, element);
        break;
      case 'Rectangle':
        drawRectangle(ctx, element);
        break;
      case 'Circle':
        drawCircle(ctx, element);
        break;
      case 'Arrow':
        drawArrow(ctx, element);
        break;
      case 'Text':
        drawText(ctx, element);
        break;
      case 'Sticky':
        drawStickyNote(ctx, element);
        break;
    }

    // Draw selection outline
    if (element.isSelected) {
      drawSelectionOutline(ctx, element);
    }

    ctx.restore();
  };

  const drawPenStroke = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    const points = element.data.points || [];
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
  };

  const drawLine = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    const { startX, startY, endX, endY } = element.data;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  const drawRectangle = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    const { x, y, width: w, height: h } = element;

    if (element.fillColor && element.fillColor !== 'transparent') {
      ctx.fillRect(x, y, w || 0, h || 0);
    }

    ctx.strokeRect(x, y, w || 0, h || 0);
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    const { x, y, width: w, height: h } = element;
    const centerX = x + (w || 0) / 2;
    const centerY = y + (h || 0) / 2;
    const radius = Math.min((w || 0), (h || 0)) / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);

    if (element.fillColor && element.fillColor !== 'transparent') {
      ctx.fill();
    }

    ctx.stroke();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    const { startX, startY, endX, endY } = element.data;
    const headLength = 15;
    const angle = Math.atan2(endY - startY, endX - startX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const drawText = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    const { text, fontSize = 16, fontFamily = 'Arial' } = element.data;

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = element.strokeColor;
    ctx.fillText(text, element.x, element.y);
  };

  const drawStickyNote = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    const { x, y, width: w = 150, height: h = 100 } = element;
    const { text = '', color = '#fff59d' } = element.data;

    // Draw sticky note background
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);

    // Draw border
    ctx.strokeStyle = '#f57f17';
    ctx.strokeRect(x, y, w, h);

    // Draw text
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    const words = text.split(' ');
    let line = '';
    let lineHeight = 20;
    let currentY = y + 25;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > w - 10 && i > 0) {
        ctx.fillText(line, x + 5, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x + 5, currentY);
  };

  const drawSelectionOutline = (ctx: CanvasRenderingContext2D, element: WhiteboardElement) => {
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const padding = 5;
    ctx.strokeRect(
      element.x - padding,
      element.y - padding,
      (element.width || 0) + padding * 2,
      (element.height || 0) + padding * 2
    );

    ctx.setLineDash([]);
  };

  const drawParticipantCursors = (ctx: CanvasRenderingContext2D) => {
    participants.forEach(participant => {
      if (participant.isOnline && participant.cursorX && participant.cursorY) {
        drawCursor(ctx, participant);
      }
    });
  };

  const drawCursor = (ctx: CanvasRenderingContext2D, participant: WhiteboardParticipant) => {
    const { cursorX = 0, cursorY = 0, cursorColor, userName } = participant;

    ctx.save();
    ctx.fillStyle = cursorColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    // Draw cursor pointer
    ctx.beginPath();
    ctx.moveTo(cursorX, cursorY);
    ctx.lineTo(cursorX + 15, cursorY + 15);
    ctx.lineTo(cursorX + 5, cursorY + 15);
    ctx.lineTo(cursorX, cursorY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw user name
    if (userName) {
      ctx.fillStyle = cursorColor;
      ctx.fillRect(cursorX + 20, cursorY, userName.length * 8 + 10, 20);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(userName, cursorX + 25, cursorY + 14);
    }

    ctx.restore();
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panX) / zoom,
      y: (clientY - rect.top - panY) / zoom
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isReadOnly) return;

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    setIsDrawing(true);

    switch (currentTool) {
      case 'Pen':
        startPenStroke(x, y);
        break;
      case 'Line':
      case 'Arrow':
        startLineElement(x, y);
        break;
      case 'Rectangle':
      case 'Circle':
        startShapeElement(x, y);
        break;
      case 'Text':
        addTextElement(x, y);
        break;
      case 'Sticky':
        addStickyNote(x, y);
        break;
      case 'Select':
        handleSelection(x, y);
        break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    // Update cursor position for other participants
    updateCursorPosition(x, y);

    if (!isDrawing || isReadOnly) return;

    switch (currentTool) {
      case 'Pen':
        continuePenStroke(x, y);
        break;
      case 'Line':
      case 'Arrow':
      case 'Rectangle':
      case 'Circle':
        updateCurrentElement(x, y);
        break;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || isReadOnly) return;

    setIsDrawing(false);
    finishCurrentElement();
    const lastElement = elements[elements.length - 1];
    if (lastElement) {
      sendElementAdd(lastElement);
    }
    addToHistory();
  };

  const startPenStroke = (x: number, y: number) => {
    const newElement: WhiteboardElement = {
      id: generateElementId(),
      type: 'Pen',
      x,
      y,
      strokeColor,
      strokeWidth,
      opacity,
      data: { points: [{ x, y }] },
      version: 1
    };

    setElements(prev => [...prev, newElement]);
  };

  const continuePenStroke = (x: number, y: number) => {
    setElements(prev => {
      const lastElement = prev[prev.length - 1];
      if (lastElement && lastElement.type === 'Pen') {
        const updatedElement = {
          ...lastElement,
          data: {
            ...lastElement.data,
            points: [...lastElement.data.points, { x, y }]
          }
        };
        return [...prev.slice(0, -1), updatedElement];
      }
      return prev;
    });
  };

  const startLineElement = (x: number, y: number) => {
    const newElement: WhiteboardElement = {
      id: generateElementId(),
      type: currentTool as ElementType,
      x,
      y,
      strokeColor,
      strokeWidth,
      opacity,
      data: { startX: x, startY: y, endX: x, endY: y },
      version: 1
    };

    setElements(prev => [...prev, newElement]);
  };

  const startShapeElement = (x: number, y: number) => {
    const newElement: WhiteboardElement = {
      id: generateElementId(),
      type: currentTool as ElementType,
      x,
      y,
      width: 0,
      height: 0,
      strokeColor,
      fillColor: fillColor !== 'transparent' ? fillColor : undefined,
      strokeWidth,
      opacity,
      data: {},
      version: 1
    };

    setElements(prev => [...prev, newElement]);
  };

  const updateCurrentElement = (x: number, y: number) => {
    setElements(prev => {
      const lastElement = prev[prev.length - 1];
      if (!lastElement) return prev;

      let updatedElement = { ...lastElement };

      switch (currentTool) {
        case 'Line':
        case 'Arrow':
          updatedElement.data = {
            ...updatedElement.data,
            endX: x,
            endY: y
          };
          break;
        case 'Rectangle':
        case 'Circle':
          updatedElement.width = Math.abs(x - updatedElement.x);
          updatedElement.height = Math.abs(y - updatedElement.y);
          if (x < updatedElement.x) {
            updatedElement.x = x;
          }
          if (y < updatedElement.y) {
            updatedElement.y = y;
          }
          break;
      }

      return [...prev.slice(0, -1), updatedElement];
    });
  };

  const addTextElement = (x: number, y: number) => {
    const text = prompt("Enter text:");
    if (!text) return;

    const newElement: WhiteboardElement = {
      id: generateElementId(),
      type: 'Text',
      x,
      y,
      strokeColor,
      opacity,
      strokeWidth: 1,
      data: { text, fontSize: 16, fontFamily: 'Arial' },
      version: 1
    };

    setElements(prev => [...prev, newElement]);
    addToHistory();
  };

  const addStickyNote = (x: number, y: number) => {
    const text = prompt("Enter note text:");
    if (text === null) return;

    const newElement: WhiteboardElement = {
      id: generateElementId(),
      type: 'Sticky',
      x,
      y,
      width: 150,
      height: 100,
      strokeColor: '#333',
      opacity,
      strokeWidth: 1,
      data: { text, color: '#fff59d' },
      version: 1
    };

    setElements(prev => [...prev, newElement]);
    addToHistory();
  };

  const handleSelection = (x: number, y: number) => {
    // Find element at coordinates
    const selectedElement = elements.find(element =>
      isPointInElement(x, y, element)
    );

    if (selectedElement) {
      setSelectedElements(new Set([selectedElement.id]));
      setElements(prev => prev.map(el => ({
        ...el,
        isSelected: el.id === selectedElement.id
      })));
    } else {
      setSelectedElements(new Set());
      setElements(prev => prev.map(el => ({ ...el, isSelected: false })));
    }
  };

  const isPointInElement = (x: number, y: number, element: WhiteboardElement): boolean => {
    switch (element.type) {
      case 'Rectangle':
      case 'Sticky':
        return x >= element.x &&
          x <= element.x + (element.width || 0) &&
          y >= element.y &&
          y <= element.y + (element.height || 0);
      case 'Circle':
        const centerX = element.x + (element.width || 0) / 2;
        const centerY = element.y + (element.height || 0) / 2;
        const radius = Math.min((element.width || 0), (element.height || 0)) / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        return distance <= radius;
      case 'Pen':
        return element.data.points?.some((point: any) =>
          Math.abs(x - point.x) < 5 && Math.abs(y - point.y) < 5
        );
      default:
        return false;
    }
  };

  const finishCurrentElement = () => {
    // Element is already added to the array, just need to sync with server if needed
  };

  const generateElementId = () => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const updateCursorPosition = (x: number, y: number) => {
    sendCursorMove(x, y);
  };

  const addToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  };

  const clearCanvas = () => {
    setElements([]);
    sendWhiteboardClear();
    addToHistory();
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center gap-2 p-3 bg-white border-b shadow-sm overflow-x-auto">
          {/* Tool Selection */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Select' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Select')}
                    disabled={isReadOnly}
                  >
                    <MousePointer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Select</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Pan' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Pan')}
                  >
                    <Hand className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pan</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Pen' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Pen')}
                    disabled={isReadOnly}
                  >
                    <Pen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pen</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Line' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Line')}
                    disabled={isReadOnly}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Line</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Rectangle' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Rectangle')}
                    disabled={isReadOnly}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rectangle</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Circle' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Circle')}
                    disabled={isReadOnly}
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Circle</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Arrow' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Arrow')}
                    disabled={isReadOnly}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Arrow</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Text' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Text')}
                    disabled={isReadOnly}
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Text</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Sticky' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Sticky')}
                    disabled={isReadOnly}
                  >
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sticky Note</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === 'Eraser' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentTool('Eraser')}
                    disabled={isReadOnly}
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eraser</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Colors */}
          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="w-12 h-8 p-1">
                <div
                  className="w-full h-full rounded border-2 border-gray-300"
                  style={{ backgroundColor: strokeColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-900">Stroke Color</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {colorPalette.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded border-2 ${strokeColor === color ? 'border-blue-500' : 'border-gray-300'
                          }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setStrokeColor(color)}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="mt-2 h-8"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Fill Color</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    <button
                      className={`w-8 h-8 rounded border-2 ${fillColor === 'transparent' ? 'border-blue-500' : 'border-gray-300'
                        } bg-white relative`}
                      onClick={() => setFillColor('transparent')}
                    >
                      <div className="absolute inset-1 bg-red-500 transform rotate-45 origin-center w-0.5 h-6"></div>
                    </button>
                    {colorPalette.slice(1).map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded border-2 ${fillColor === color ? 'border-blue-500' : 'border-gray-300'
                          }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFillColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Stroke Width */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-900">Width:</Label>
            <Slider
              value={[strokeWidth]}
              onValueChange={(value) => setStrokeWidth(value[0])}
              min={1}
              max={20}
              step={1}
              className="w-20"
            />
            <span className="text-sm w-6 text-gray-900">{strokeWidth}</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCanvas}
                    disabled={isReadOnly}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear All</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* View Controls */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleZoom(0.1)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-sm font-mono px-2 text-gray-900">
              {Math.round(zoom * 100)}%
            </span>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleZoom(-0.1)}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetView}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset View</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showGrid ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                        setShowGrid(!showGrid);
                        // toast.info(showGrid ? "Grid hidden" : "Grid visible"); // Whiteboard is often used inside video call where toast might be redundant but helpful
                    }}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Grid Lines</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 ml-auto">
            {showParticipants && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowParticipantsPanel(!showParticipantsPanel)}
                    >
                      <Users className="h-4 w-4" />
                      <Badge variant="secondary" className="ml-1">
                        {participants.filter(p => p.isOnline).length}
                      </Badge>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Participants</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-gray-100">
        <div
          ref={containerRef}
          className="w-full h-full cursor-crosshair"
          style={{
            cursor: currentTool === 'Select' ? 'default' :
              currentTool === 'Pan' ? 'move' : 'crosshair'
          }}
        >
          <canvas
            ref={canvasRef}
            className="border shadow-sm bg-white"
            style={{
              transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
              transformOrigin: '0 0'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Participants Panel */}
        {showParticipantsPanel && showParticipants && (
          <div className="absolute top-4 right-4 w-64 bg-white rounded-lg shadow-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Participants</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowParticipantsPanel(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {participants.map(participant => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-gray-50"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: participant.cursorColor }}
                  />
                  <span className="flex-1 text-sm">{participant.userName}</span>
                  <Badge
                    variant={participant.isOnline ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {participant.role}
                  </Badge>
                  <div
                    className={`w-2 h-2 rounded-full ${participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                  />
                </div>
              ))}

              {participants.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No other participants
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}