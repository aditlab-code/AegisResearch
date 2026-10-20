import React, { useState } from "react";
import { Sigma } from "lucide-react";
import { PopoverShell } from "./PopoverShell";

export interface MathPalettePopoverProps {
  isLatex?: boolean;
  onInsert: (code: string) => void;
  onClose: () => void;
}

type MathCategory = "Limit" | "Integral" | "Algebra" | "Vector" | "Trig";

interface MathFormulaItem {
  label: string;
  preview: string;
  code: string;
}

const FORMULAS_BY_CATEGORY: Record<MathCategory, MathFormulaItem[]> = {
  Limit: [
    {
      label: "Standard Limit",
      preview: "lim x→0 f(x)",
      code: "\\lim_{x \\to 0} f(x)",
    },
    {
      label: "Infinite Limit",
      preview: "lim n→∞ a_n",
      code: "\\lim_{n \\to \\infty} a_n",
    },
    {
      label: "Left Limit",
      preview: "lim x→a⁻ f(x)",
      code: "\\lim_{x \\to a^-} f(x)",
    },
    {
      label: "Right Limit",
      preview: "lim x→a⁺ f(x)",
      code: "\\lim_{x \\to a^+} f(x)",
    },
    {
      label: "Limsup",
      preview: "limsup x_n",
      code: "\\limsup_{n \\to \\infty} x_n",
    },
  ],
  Integral: [
    {
      label: "Indefinite Integral",
      preview: "∫ f(x) dx",
      code: "\\int f(x) \\, dx",
    },
    {
      label: "Definite Integral",
      preview: "∫_a^b f(x) dx",
      code: "\\int_{a}^{b} f(x) \\, dx",
    },
    {
      label: "Double Integral",
      preview: "∬_D f(x,y) dA",
      code: "\\iint_{D} f(x, y) \\, dA",
    },
    {
      label: "Contour Integral",
      preview: "∮_C F · dr",
      code: "\\oint_{C} \\vec{F} \\cdot d\\vec{r}",
    },
    {
      label: "Partial Derivative",
      preview: "∂f / ∂x",
      code: "\\frac{\\partial f}{\\partial x}",
    },
  ],
  Algebra: [
    { label: "Fraction", preview: "a / b", code: "\\frac{a}{b}" },
    { label: "Binomial", preview: "(n k)", code: "\\binom{n}{k}" },
    { label: "Square Root", preview: "√x", code: "\\sqrt{x}" },
    { label: "N-th Root", preview: "ⁿ√x", code: "\\sqrt[n]{x}" },
    { label: "Factorial", preview: "n!", code: "n!" },
    {
      label: "Polynomial",
      preview: "ax² + bx + c = 0",
      code: "ax^2 + bx + c = 0",
    },
  ],
  Vector: [
    { label: "Vector Arrow", preview: "v⃗", code: "\\vec{v}" },
    { label: "Bold Vector", preview: "A", code: "\\mathbf{A}" },
    { label: "Unit Hat", preview: "û", code: "\\hat{u}" },
    {
      label: "Dot Product",
      preview: "u · v",
      code: "\\vec{u} \\cdot \\vec{v}",
    },
    {
      label: "Cross Product",
      preview: "u × v",
      code: "\\vec{u} \\times \\vec{v}",
    },
    {
      label: "2x2 Matrix (p)",
      preview: "(a b; c d)",
      code: "\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}",
    },
    {
      label: "2x2 Matrix (b)",
      preview: "[a b; c d]",
      code: "\\begin{bmatrix}\n  a & b \\\\\n  c & d\n\\end{bmatrix}",
    },
  ],
  Trig: [
    { label: "Sine", preview: "sin(θ)", code: "\\sin(\\theta)" },
    { label: "Cosine", preview: "cos(θ)", code: "\\cos(\\theta)" },
    { label: "Tangent", preview: "tan(θ)", code: "\\tan(\\theta)" },
    { label: "Arcsin", preview: "arcsin(x)", code: "\\arcsin(x)" },
    {
      label: "Pythagorean",
      preview: "sin²θ + cos²θ = 1",
      code: "\\sin^2(\\theta) + \\cos^2(\\theta) = 1",
    },
    { label: "Pi & Theta", preview: "π, θ", code: "\\pi, \\theta" },
  ],
};

export const MathPalettePopover: React.FC<MathPalettePopoverProps> = ({
  isLatex = true,
  onInsert,
  onClose,
}) => {
  const [mode, setMode] = useState<"inline" | "display">("inline");
  const [activeCategory, setActiveCategory] = useState<MathCategory>("Limit");

  const categories: MathCategory[] = [
    "Limit",
    "Integral",
    "Algebra",
    "Vector",
    "Trig",
  ];

  const handleSelectFormula = (rawCode: string) => {
    let finalCode = rawCode;

    if (isLatex) {
      if (mode === "inline") {
        finalCode = `\\(${rawCode}\\)`;
      } else {
        finalCode = `\n\\[\n  ${rawCode}\n\\]\n`;
      }
    } else {
      if (mode === "inline") {
        finalCode = `$${rawCode}$`;
      } else {
        finalCode = `\n$$\n${rawCode}\n$$\n`;
      }
    }

    onInsert(finalCode);
    onClose();
  };

  return (
    <PopoverShell
      title="Equation Builder"
      icon={Sigma}
      onClose={onClose}
      widthClass="w-96"
    >
      {/* Mode Toggle Controls */}
      <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 p-1 rounded mb-2 text-[11px]">
        <span className="font-semibold text-zinc-600 dark:text-zinc-300 px-1">
          Mode:
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("inline")}
            className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
              mode === "inline"
                ? "bg-white dark:bg-zinc-900 text-[#4078f2] dark:text-[#61afef] shadow-sm font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Inline {isLatex ? "\\(..\\)" : "$..$"}
          </button>
          <button
            type="button"
            onClick={() => setMode("display")}
            className={`px-2.5 py-0.5 rounded font-medium transition-colors ${
              mode === "display"
                ? "bg-white dark:bg-zinc-900 text-[#4078f2] dark:text-[#61afef] shadow-sm font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Display {isLatex ? "\\[..\\]" : "$$..$$"}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-2 gap-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1 border-b-2 font-medium transition-colors ${
              activeCategory === cat
                ? "border-[#4078f2] dark:border-[#61afef] text-[#4078f2] dark:text-[#61afef] font-semibold"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Formula Item List */}
      <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
        {FORMULAS_BY_CATEGORY[activeCategory].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectFormula(item.code)}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-blue-50/70 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-500 transition-colors text-left group"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 shrink-0">
                {item.label}
              </span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 truncate">
                {item.preview}
              </span>
            </div>
            <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 px-1.5 py-0.5 rounded font-mono shrink-0">
              {item.code.slice(0, 16)}...
            </code>
          </button>
        ))}
      </div>
    </PopoverShell>
  );
};
