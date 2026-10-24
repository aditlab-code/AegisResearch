import React from "react";
import { ArrowRight, X } from "lucide-react";
import { MeasurementScale } from "../../../types/stats";
import { getScaleMeta } from "../../../utils/measurementScale";

export interface SingleVariableSlotProps {
  label: string;
  value: string | null;
  onSet: () => void;
  onClear: () => void;
  selectedAvailable: string | null;
  scale?: MeasurementScale;
  buttonText?: string;
  placeholder?: string;
  highlightClass?: string;
}

export const SingleVariableSlot: React.FC<SingleVariableSlotProps> = ({
  label,
  value,
  onSet,
  onClear,
  selectedAvailable,
  scale,
  buttonText = "Set",
  placeholder = "Select 1 variable",
  highlightClass = "text-indigo-600 dark:text-indigo-400",
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        {selectedAvailable && (
          <button
            type="button"
            onClick={onSet}
            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            <ArrowRight className="w-2.5 h-2.5" /> {buttonText}
          </button>
        )}
      </div>
      <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
        {value ? (
          <div className="flex items-center justify-between w-full">
            <span className={`font-semibold ${highlightClass}`}>
              {value}{" "}
              {scale && (
                <span className="text-[9px] font-normal text-zinc-400">
                  ({getScaleMeta(scale).shortLabel})
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={onClear}
              className="text-zinc-400 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span className="text-zinc-400 italic text-[10px]">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
};

export interface MultiVariableSlotProps {
  label: string;
  values: string[];
  onAdd: () => void;
  onRemove: (v: string) => void;
  selectedAvailable: string | null;
  variableScales?: Record<string, MeasurementScale>;
  buttonText?: string;
  placeholder?: string;
  minHeight?: string;
  chipClass?: string;
  showScale?: boolean;
}

export const MultiVariableSlot: React.FC<MultiVariableSlotProps> = ({
  label,
  values,
  onAdd,
  onRemove,
  selectedAvailable,
  variableScales,
  buttonText = "Add",
  placeholder = "Select variables",
  minHeight = "min-h-[60px]",
  chipClass = "bg-zinc-100 dark:bg-zinc-800",
  showScale = true,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
        {selectedAvailable && (
          <button
            type="button"
            onClick={onAdd}
            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            <ArrowRight className="w-2.5 h-2.5" /> {buttonText}
          </button>
        )}
      </div>
      <div
        className={`p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] ${minHeight} flex flex-wrap gap-1 content-start`}
      >
        {values.length === 0 ? (
          <span className="text-zinc-400 italic text-[10px]">
            {placeholder}
          </span>
        ) : (
          values.map((v) => (
            <span
              key={v}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${chipClass}`}
            >
              {v}{" "}
              {showScale && variableScales && (
                <span className="text-[9px] text-zinc-400">
                  ({getScaleMeta(variableScales[v] || "scale").shortLabel})
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(v)}
                className="hover:text-red-500"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
};
