import React from "react";

export interface TTestOptionsProps {
  alternative: "two-sided" | "greater" | "less";
  onChangeAlternative: (val: "two-sided" | "greater" | "less") => void;
  missingStrategy: "pairwise" | "listwise";
  onChangeMissing: (val: "pairwise" | "listwise") => void;
  labels: [string, string, string];
  radioNamePrefix: string;
}

export const TTestOptions: React.FC<TTestOptionsProps> = ({
  alternative,
  onChangeAlternative,
  missingStrategy,
  onChangeMissing,
  labels,
  radioNamePrefix,
}) => {
  return (
    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
      <div>
        <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
          Alternative Hypothesis:
        </span>
        <div className="flex items-center gap-3 text-[10px] text-zinc-600 dark:text-zinc-400">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={`${radioNamePrefix}_alt`}
              value="two-sided"
              checked={alternative === "two-sided"}
              onChange={() => onChangeAlternative("two-sided")}
              className="text-indigo-600"
            />
            {labels[0]}
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={`${radioNamePrefix}_alt`}
              value="greater"
              checked={alternative === "greater"}
              onChange={() => onChangeAlternative("greater")}
              className="text-indigo-600"
            />
            {labels[1]}
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={`${radioNamePrefix}_alt`}
              value="less"
              checked={alternative === "less"}
              onChange={() => onChangeAlternative("less")}
              className="text-indigo-600"
            />
            {labels[2]}
          </label>
        </div>
      </div>
      <div>
        <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
          Missing Values:
        </span>
        <div className="flex items-center gap-3 text-[10px] text-zinc-600 dark:text-zinc-400">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={`${radioNamePrefix}_missing`}
              value="pairwise"
              checked={missingStrategy === "pairwise"}
              onChange={() => onChangeMissing("pairwise")}
              className="text-indigo-600"
            />
            Exclude cases per variable
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name={`${radioNamePrefix}_missing`}
              value="listwise"
              checked={missingStrategy === "listwise"}
              onChange={() => onChangeMissing("listwise")}
              className="text-indigo-600"
            />
            Exclude cases listwise
          </label>
        </div>
      </div>
    </div>
  );
};
