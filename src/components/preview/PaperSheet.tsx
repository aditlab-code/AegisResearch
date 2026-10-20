import React from "react";
import { PaperSize, PAPER_PRESETS } from "../../types";

export interface PaperSheetProps {
  paperSize: PaperSize;
  zoom?: number;
  pageNumber?: number;
  children: React.ReactNode;
}

export const PaperSheet: React.FC<PaperSheetProps> = ({
  paperSize,
  zoom = 1.0,
  pageNumber = 1,
  children,
}) => {
  const preset = PAPER_PRESETS[paperSize] || PAPER_PRESETS.a4;

  const width = Math.round(preset.baseWidthPx * zoom);
  const minHeight = Math.round(preset.baseHeightPx * zoom);

  return (
    <div className="flex flex-col items-center my-6">
      {/* Physical Paper Sheet with realistic drop shadow */}
      <div
        style={{
          width: `${width}px`,
          minHeight: `${minHeight}px`,
        }}
        className="bg-white text-stone-900 border border-stone-300 shadow-2xl shadow-black/40 relative transition-[width,min-height] duration-150 ease-out origin-top"
      >
        {/* Subtle page header indicator */}
        <div className="absolute top-2 right-4 text-[9px] font-mono text-stone-400 select-none">
          {preset.name.toUpperCase()} · Hal. {pageNumber}
        </div>

        {/* Paper printable content area with authentic margins */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: `${preset.baseWidthPx}px`,
          }}
          className="p-14 font-serif text-[15px] leading-relaxed"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
