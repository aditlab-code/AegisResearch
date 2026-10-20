import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { Doc } from "../../types";
import { buildApiUrl } from "../../services";

export interface ImageViewerTabProps {
  doc: Doc;
  projectName: string;
}

export const ImageViewerTab: React.FC<ImageViewerTabProps> = ({
  doc,
  projectName,
}) => {
  const [scale, setScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Raw image URL from backend raw endpoint
  const imageUrl = buildApiUrl(
    `/api/projects/${encodeURIComponent(projectName)}/raw/${encodeURIComponent(doc.path || doc.name)}`,
    { t: Date.now() },
  );

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.25, 5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.25, 0.2));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev * 1.1, 5));
    } else {
      setScale((prev) => Math.max(prev / 1.1, 0.2));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-100 dark:bg-zinc-950 select-none overflow-hidden">
      {/* Top action toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-purple-500 shrink-0" />
          <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-xs">
            {doc.name}
          </span>
          {naturalSize && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono">
              {naturalSize.width} × {naturalSize.height} px
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <span className="font-mono text-[11px] w-12 text-center text-zinc-700 dark:text-zinc-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom & Pan"
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <a
            href={imageUrl}
            download={doc.name}
            title="Download Image"
            className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors ml-1"
          >
            <Download className="size-3.5" />
          </a>
        </div>
      </div>

      {/* Main Canvas / Image Area with transparency checkerboard */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-6"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          backgroundImage:
            "radial-gradient(#a1a1aa 0.75px, transparent 0.75px), radial-gradient(#a1a1aa 0.75px, #f4f4f5 0.75px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 12px 12px",
        }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          className="max-w-full max-h-full flex items-center justify-center"
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt={doc.name}
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalSize({
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            }}
            className="shadow-xl rounded border border-zinc-200 dark:border-zinc-800 object-contain bg-white dark:bg-zinc-900"
          />
        </div>
      </div>
    </div>
  );
};
