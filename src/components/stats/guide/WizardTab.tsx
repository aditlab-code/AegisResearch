import React, { useState, useMemo } from "react";
import { Compass, CheckCircle2, Play } from "lucide-react";
import { AnalysisType, MeasurementScale } from "../../../types/stats";
import { WizardPurpose, WizardGroupDesign } from "./guideData";
import {
  PURPOSE_ITEMS,
  SCALE_ITEMS,
  GROUP_DESIGN_ITEMS,
} from "./wizardConstants";
import { getRecommendation } from "./wizardRecommendation";

export interface WizardTabProps {
  onSelectAnalysis: (type: AnalysisType) => void;
  onClose: () => void;
}

export const WizardTab: React.FC<WizardTabProps> = ({
  onSelectAnalysis,
  onClose,
}) => {
  const [purpose, setPurpose] = useState<WizardPurpose>("comparison");
  const [scale, setScale] = useState<MeasurementScale>("scale");
  const [groupDesign, setGroupDesign] = useState<WizardGroupDesign>("2_indep");
  const [isNormal, setIsNormal] = useState<boolean>(true);

  const recommendation = useMemo(
    () => getRecommendation(purpose, scale, groupDesign, isNormal),
    [purpose, scale, groupDesign, isNormal],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Question Form */}
      <div className="md:col-span-7 flex flex-col gap-3.5">
        {/* Step 1: Purpose */}
        <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
          <label className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 block mb-1.5">
            1. What is the primary purpose of your analysis?
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {PURPOSE_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPurpose(item.id)}
                className={`p-2 rounded border text-left transition cursor-pointer ${
                  purpose === item.id
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="text-[11px] leading-tight">{item.label}</div>
                <div className="text-[9px] text-zinc-400 font-normal leading-tight mt-0.5">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Measurement Scale */}
        {purpose !== "instrument" &&
          purpose !== "reduction" &&
          purpose !== "exploration" && (
            <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
              <label className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                2. What is the measurement scale of your outcome variable?
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {SCALE_ITEMS.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setScale(item.id)}
                      className={`p-2 rounded border text-left transition cursor-pointer ${
                        scale === item.id
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <IconComponent
                          className={`w-3.5 h-3.5 ${item.badge}`}
                        />
                        <span className="text-[10px] font-medium leading-tight">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[9px] text-zinc-400 font-normal leading-tight">
                        {item.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Step 3: Grouping & Design */}
        {purpose === "comparison" && scale !== "nominal" && (
          <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <label className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 block mb-1.5">
              3. How many groups and what is the sample design?
            </label>
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {GROUP_DESIGN_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGroupDesign(item.id)}
                  className={`p-1.5 rounded border text-left transition cursor-pointer ${
                    groupDesign === item.id
                      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="text-[10px] font-medium leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-normal leading-tight">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px]">
              <span className="text-zinc-600 dark:text-zinc-400">
                Data Normality Assumption:
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="normality"
                    checked={isNormal}
                    onChange={() => setIsNormal(true)}
                    className="text-amber-500"
                  />
                  <span>Normal (p &gt; 0.05)</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="normality"
                    checked={!isNormal}
                    onChange={() => setIsNormal(false)}
                    className="text-amber-500"
                  />
                  <span>Non-Normal / Distribution-Free</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendation Box */}
      <div className="md:col-span-5 flex flex-col justify-between p-3.5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/10">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Recommended Method
            </span>
          </div>

          {/* Primary Recommendation */}
          <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/60 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
              Primary Test
            </div>
            <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">
              {recommendation.primary.title}
            </div>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              {recommendation.rationale}
            </p>
          </div>

          {/* Alternative if applicable */}
          {recommendation.alternative && (
            <div className="p-2 rounded bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[9px] uppercase font-semibold text-zinc-400">
                Alternative If Normality Violated
              </div>
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                {recommendation.alternative.title}
              </div>
            </div>
          )}

          {/* Assumptions checklist */}
          <div>
            <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Assumptions to Satisfy:
            </span>
            <ul className="space-y-1">
              {recommendation.assumptions.map((asm, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{asm}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Launch Action */}
        <div className="pt-3 border-t border-amber-200 dark:border-amber-800/60 flex flex-col gap-1.5 mt-3">
          <button
            onClick={() => {
              onSelectAnalysis(recommendation.primary.type);
              onClose();
            }}
            className="w-full py-2 px-3 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch {recommendation.primary.title}</span>
          </button>

          {recommendation.alternative && (
            <button
              onClick={() => {
                onSelectAnalysis(recommendation.alternative!.type);
                onClose();
              }}
              className="w-full py-1.5 px-3 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <span>
                Launch Alternative: {recommendation.alternative.title}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
