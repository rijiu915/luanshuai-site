'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Pencil, Eraser, Square, Circle, Type, Crop, Move, Download, ChevronLeft,
  Undo2, Redo2, Trash2, Save, Image, Palette, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';

// ============ Types ============
type Tool =
  | 'move' | 'select'
  | 'pen' | 'eraser'
  | 'rectangle' | 'circle' | 'line'
  | 'text' | 'crop';

interface DrawingAction {
  tool: Tool;
  color: string;
  lineWidth: number;
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  text?: string;
  fontSize?: number;
}

// ============ Suspense Wrapper for useSearchParams ============
function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get('image');
  console.log('NewEditor initialized, imageUrl:', imageUrl);

  const [activeTool, setActiveTool] = useState<Tool>('move');
  const [color, setColor] = useState('#FF0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);
  const [actions, setActions] = useState<DrawingAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingAction[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [textValue, setTextValue] = useState('');
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // ============ Load image ============
  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;

    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        const blobUrl = URL.createObjectURL(blob);
        const img = new window.Image();
        img.onload = () => {
          if (!cancelled) setLoadedImage(img);
        };
        img.src = blobUrl;
      })
      .catch(() => {
        if (cancelled) return;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { if (!cancelled) setLoadedImage(img); };
        img.src = imageUrl;
      });

    return () => { cancelled = true; };
  }, [imageUrl]);

  // ============ Canvas sizing ============
  useEffect(() => {
    if (!loadedImage || !canvasRef.current || !overlayCanvasRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const imgRatio = loadedImage.width / loadedImage.height;
    const containerRatio = cw / ch;
    let drawW: number, drawH: number;
    if (imgRatio > containerRatio) {
      drawW = cw * 0.9;
      drawH = drawW / imgRatio;
    } else {
      drawH = ch * 0.9;
      drawW = drawH * imgRatio;
    }

    const canvasW = loadedImage.width;
    const canvasH = loadedImage.height;
    canvasRef.current.width = canvasW;
    canvasRef.current.height = canvasH;
    overlayCanvasRef.current.width = canvasW;
    overlayCanvasRef.current.height = canvasH;

    const fitScale = Math.min(drawW / canvasW, drawH / canvasH);
    setScale(fitScale);
    setPanOffset({
      x: (cw - canvasW * fitScale) / 2,
      y: (ch - canvasH * fitScale) / 2,
    });
  }, [loadedImage]);

  // ============ Drawing ============
  const drawAction = useCallback((ctx: CanvasRenderingContext2D, action: DrawingAction) => {
    ctx.save();
    ctx.strokeStyle = action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (action.tool === 'pen' && action.points && action.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(action.points[0].x, action.points[0].y);
      for (let i = 1; i < action.points.length; i++) {
        ctx.lineTo(action.points[i].x, action.points[i].y);
      }
      ctx.stroke();
    } else if (action.tool === 'rectangle') {
      const sx = action.startX!, sy = action.startY!, ex = action.endX!, ey = action.endY!;
      ctx.strokeRect(sx, sy, ex - sx, ey - sy);
    } else if (action.tool === 'circle') {
      const rx = Math.abs(action.endX! - action.startX!) / 2;
      const ry = Math.abs(action.endY! - action.startY!) / 2;
      const cx = (action.startX! + action.endX!) / 2;
      const cy = (action.startY! + action.endY!) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (action.tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(action.startX!, action.startY!);
      ctx.lineTo(action.endX!, action.endY!);
      ctx.stroke();
    } else if (action.tool === 'text' && action.text) {
      ctx.font = `bold ${action.fontSize || 24}px sans-serif`;
      ctx.fillText(action.text, action.startX!, action.startY!);
    }

    ctx.restore();
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImage, 0, 0);
    for (const action of actions) {
      drawAction(ctx, action);
    }
  }, [actions, loadedImage, drawAction]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  // Overlay drawing (preview)
  const drawOverlay = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (isDrawing && startPos && currentPos) {
      if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line') {
        drawAction(ctx, {
          tool: activeTool,
          color, lineWidth,
          startX: startPos.x, startY: startPos.y,
          endX: currentPos.x, endY: currentPos.y,
        });
      } else if (activeTool === 'pen' && currentPoints.length > 0) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.stroke();
      } else if (activeTool === 'crop') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, overlay.width, overlay.height);
        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const w = Math.abs(currentPos.x - startPos.x);
        const h = Math.abs(currentPos.y - startPos.y);
        ctx.clearRect(x, y, w, h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, w, h);
      }
    }

    if (cropRect && activeTool === 'crop' && !isDrawing) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, overlay.width, overlay.height);
      ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    }
  }, [isDrawing, startPos, currentPos, activeTool, color, lineWidth, currentPoints, cropRect, drawAction]);

  useEffect(() => { drawOverlay(); }, [drawOverlay]);

  // ============ Mouse handlers ============
  const canvasCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - panOffset.x) / scale,
      y: (e.clientY - rect.top - panOffset.y) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = canvasCoords(e);
    if (activeTool === 'move') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (activeTool === 'text') {
      setTextInput({ x: pos.x, y: pos.y, visible: true });
      setTextValue('');
      setTimeout(() => textInputRef.current?.focus(), 10);
    } else if (activeTool === 'pen' || activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'crop') {
      setIsDrawing(true);
      setStartPos(pos);
      setCurrentPos(pos);
      if (activeTool === 'pen') {
        setCurrentPoints([pos]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = canvasCoords(e);
    if (activeTool === 'move' && isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (isDrawing && startPos) {
      setCurrentPos(pos);
      if (activeTool === 'pen') {
        setCurrentPoints((prev) => [...prev, pos]);
      }
    }
  };

  const handleMouseUp = () => {
    if (activeTool === 'move' && isPanning) {
      setIsPanning(false);
    } else if (isDrawing && startPos && currentPos) {
      if (activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line') {
        const newAction: DrawingAction = {
          tool: activeTool,
          color,
          lineWidth,
          startX: startPos.x,
          startY: startPos.y,
          endX: currentPos.x,
          endY: currentPos.y,
        };
        setActions((prev) => [...prev, newAction]);
        setRedoStack([]);
      } else if (activeTool === 'pen' && currentPoints.length > 0) {
        const newAction: DrawingAction = {
          tool: 'pen',
          color,
          lineWidth,
          points: [...currentPoints],
        };
        setActions((prev) => [...prev, newAction]);
        setRedoStack([]);
      } else if (activeTool === 'crop') {
        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const w = Math.abs(currentPos.x - startPos.x);
        const h = Math.abs(currentPos.y - startPos.y);
        setCropRect({ x, y, w, h });
      }
      setIsDrawing(false);
      setStartPos(null);
      setCurrentPos(null);
      setCurrentPoints([]);
    }
  };

  const handleMouseLeave = () => {
    if (isPanning) setIsPanning(false);
    if (isDrawing) {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentPos(null);
      setCurrentPoints([]);
    }
  };

  const getCursor = (): string => {
    switch (activeTool) {
      case 'move': return isPanning ? 'grabbing' : 'grab';
      case 'pen': case 'rectangle': case 'circle': case 'line': case 'crop': return 'crosshair';
      case 'text': return 'text';
      default: return 'default';
    }
  };

  // ============ Text handling ============
  const confirmText = () => {
    if (textValue.trim() && textInput.visible) {
      setActions((prev) => [...prev, { tool: 'text', color, lineWidth, fontSize, startX: textInput.x, startY: textInput.y, text: textValue.trim() }]);
      setRedoStack([]);
    }
    setTextInput({ x: 0, y: 0, visible: false });
    setTextValue('');
  };

  // ============ Undo/Redo ============
  const undo = () => {
    if (actions.length === 0) return;
    const last = actions[actions.length - 1];
    setActions((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setActions((prev) => [...prev, last]);
  };

  // ============ Crop ============
  const applyCrop = () => {
    if (!cropRect || !canvasRef.current || !loadedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw everything onto the main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(loadedImage, 0, 0);
    for (const action of actions) {
      drawAction(ctx, action);
    }

    // Clamp crop coordinates
    const x = Math.max(0, Math.round(cropRect.x));
    const y = Math.max(0, Math.round(cropRect.y));
    const w = Math.min(Math.round(cropRect.w), canvas.width - x);
    const h = Math.min(Math.round(cropRect.h), canvas.height - y);

    if (w <= 0 || h <= 0) {
      setCropRect(null);
      return;
    }

    // Create temp canvas for cropped region
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw cropped region
    tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    let dataUrl: string;
    try {
      dataUrl = tempCanvas.toDataURL('image/png');
    } catch (err) {
      alert('裁剪失败，可能是跨域限制');
      setCropRect(null);
      return;
    }

    // Create new image from cropped data
    const newImg = new window.Image();
    newImg.onload = () => {
      setActions([]);
      setRedoStack([]);
      setCropRect(null);

      // Resize canvases
      if (canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = w;
        overlayCanvasRef.current.height = h;
        const oCtx = overlayCanvasRef.current.getContext('2d');
        oCtx?.clearRect(0, 0, w, h);
      }

      // Recenter the cropped image
      if (containerRef.current) {
        const container = containerRef.current;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const imgRatio = newImg.width / newImg.height;
        const containerRatio = cw / ch;
        let drawW: number, drawH: number;
        if (imgRatio > containerRatio) {
          drawW = cw * 0.9;
          drawH = drawW / imgRatio;
        } else {
          drawH = ch * 0.9;
          drawW = drawH * imgRatio;
        }
        const fitScale = Math.min(drawW / newImg.width, drawH / newImg.height);
        setScale(fitScale);
        setPanOffset({
          x: (cw - newImg.width * fitScale) / 2,
          y: (ch - newImg.height * fitScale) / 2,
        });
      }

      setLoadedImage(newImg);
    };
    newImg.src = dataUrl;
  };

  // ============ Clear and download ============
  const clearAll = () => { setActions([]); setRedoStack([]); setCropRect(null); };
  const downloadResult = () => {
    if (!canvasRef.current) return;
    redrawCanvas();
    const link = document.createElement('a');
    link.download = `edited-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // ============ Use edited image ============
  const handleUse = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert('画布不可用');
      return;
    }

    // Ensure canvas content is up-to-date
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (loadedImage) {
        ctx.drawImage(loadedImage, 0, 0);
      }
      for (const action of actions) {
        drawAction(ctx, action);
      }
    }

    // 获取原始尺寸
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const maxDimension = 1024; // 限制在 1024px 内，确保 base64 不超出 sessionStorage 限制
    
    let targetCanvas = canvas;
    
    // 如果图片太大，创建一个缩小的版本
    if (originalWidth > maxDimension || originalHeight > maxDimension) {
      const scale = Math.min(maxDimension / originalWidth, maxDimension / originalHeight);
      const newWidth = Math.round(originalWidth * scale);
      const newHeight = Math.round(originalHeight * scale);
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
        targetCanvas = tempCanvas;
        console.log('handleUse: resized from', originalWidth, 'x', originalHeight, 'to', newWidth, 'x', newHeight);
      }
    }

    // 使用 JPEG 格式，质量 0.7，压缩率更高
    targetCanvas.toBlob((blob) => {
      if (!blob) {
        alert('导出图片失败');
        return;
      }

      const sizeKB = blob.size / 1024;
      console.log('handleUse: blob size =', Math.round(sizeKB), 'KB');

      // 直接读取 blob 为 base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64SizeKB = (base64.length * 3) / 4 / 1024;
        console.log('handleUse: base64 size =', Math.round(base64SizeKB), 'KB');

        if (base64SizeKB > 4000) {
          alert('图片太大，请尝试裁剪或缩小后再保存');
          return;
        }

        try {
          sessionStorage.setItem('editedImage', base64);
          console.log('handleUse: saved to sessionStorage');
          setTimeout(() => router.back(), 100);
        } catch (err) {
          console.error('handleUse: save failed', err);
          alert('保存失败，图片太大，请裁剪后再试');
        }
      };
      reader.onerror = () => {
        alert('图片转换失败');
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.7);
  };

  // ============ Zoom controls ============
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(0.1, Math.min(5, prev + delta)));
  };

  if (!imageUrl) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">没有选择图片进行编辑</p>
          <button onClick={() => router.back()} className="px-6 py-2 bg-blue-600 text-white rounded-lg">返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Top Toolbar */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
            <ChevronLeft className="w-5 h-5" />返回
          </button>
          <div className="w-px h-6 bg-gray-600" />
          <button onClick={undo} disabled={actions.length === 0} className="p-2 rounded hover:bg-gray-700 disabled:opacity-50">
            <Undo2 className="w-5 h-5" />
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} className="p-2 rounded hover:bg-gray-700 disabled:opacity-50">
            <Redo2 className="w-5 h-5" />
          </button>
          <button onClick={downloadResult} className="p-2 rounded hover:bg-gray-700">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={clearAll} className="p-2 rounded hover:bg-gray-700 text-red-400">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">图片编辑器</span>
          <button onClick={handleUse} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">
            立即使用
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 gap-2">
          {[
            { tool: 'move' as Tool, icon: <Move className="w-5 h-5" />, label: '移动' },
            { tool: 'pen' as Tool, icon: <Pencil className="w-5 h-5" />, label: '画笔' },
            { tool: 'eraser' as Tool, icon: <Eraser className="w-5 h-5" />, label: '橡皮' },
            { tool: 'rectangle' as Tool, icon: <Square className="w-5 h-5" />, label: '矩形' },
            { tool: 'circle' as Tool, icon: <Circle className="w-5 h-5" />, label: '圆形' },
            { tool: 'line' as Tool, icon: <Image className="w-5 h-5" />, label: '直线' },
            { tool: 'text' as Tool, icon: <Type className="w-5 h-5" />, label: '文本' },
            { tool: 'crop' as Tool, icon: <Crop className="w-5 h-5" />, label: '裁剪' },
          ].map(({ tool, icon, label }) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg text-xs transition-all ${
                activeTool === tool ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title={label}
            >
              {icon}
              <span className="mt-1">{label}</span>
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 relative bg-gray-800 overflow-hidden"
          style={{ cursor: getCursor() }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        >
          <div style={{ position: 'absolute', left: panOffset.x, top: panOffset.y, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
            <canvas ref={canvasRef} className="block" />
            <canvas ref={overlayCanvasRef} className="absolute top-0 left-0 block" style={{ pointerEvents: 'none' }} />
          </div>

          {/* Text Input */}
          {textInput.visible && (
            <div className="absolute z-20" style={{ left: textInput.x * scale + panOffset.x, top: textInput.y * scale + panOffset.y - fontSize * scale }}>
              <input
                ref={textInputRef}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmText(); if (e.key === 'Escape') setTextInput({ x: 0, y: 0, visible: false }); }}
                onBlur={confirmText}
                className="bg-transparent border-b-2 border-blue-500 text-white outline-none px-1 min-w-[100px]"
                style={{ fontSize: fontSize * scale }}
                placeholder="输入文字..."
              />
            </div>
          )}

          {/* Crop Controls */}
          {cropRect && activeTool === 'crop' && !isDrawing && (
            <div
              className="absolute z-20 flex gap-2"
              style={{ left: (cropRect.x + cropRect.w) * scale + panOffset.x - 160, top: (cropRect.y + cropRect.h) * scale + panOffset.y + 8 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); applyCrop(); }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                确认裁剪
              </button>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setCropRect(null); }}
                className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600"
              >
                取消
              </button>
            </div>
          )}

          {/* Loading State */}
          {!loadedImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
            </div>
          )}
        </div>

        {/* Right Toolbar */}
        <div className="w-48 bg-gray-800 border-l border-gray-700 p-4">
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">颜色</h3>
            <div className="grid grid-cols-4 gap-2">
              {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded border-2 ${color === c ? 'border-blue-500' : 'border-gray-600'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">线条粗细</h3>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="text-xs text-gray-400 mt-1">{lineWidth}px</div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">字号</h3>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="text-xs text-gray-400 mt-1">{fontSize}px</div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">缩放</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setScale((prev) => Math.max(0.1, prev - 0.1))}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <ZoomOut className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setScale(1)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <Maximize2 className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setScale((prev) => Math.min(5, prev + 0.1))}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                <ZoomIn className="w-4 h-4 mx-auto" />
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-2 text-center">{Math.round(scale * 100)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Page Component with Suspense ============
export default function NewEditor() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载编辑器...</div>}>
      <EditorContent />
    </Suspense>
  );
}
