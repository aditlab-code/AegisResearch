import React, { useState } from 'react'
import { X } from 'lucide-react'

export interface MathPalettePopoverProps {
  isLatex?: boolean
  onInsert: (code: string) => void
  onClose: () => void
}

type MathCategory = 'Limit' | 'Integral' | 'Factor' | 'Vector' | 'Trig'

interface MathFormulaItem {
  label: string
  preview: string
  code: string
}

const FORMULAS_BY_CATEGORY: Record<MathCategory, MathFormulaItem[]> = {
  Limit: [
    { label: 'Limit Standar', preview: 'lim x→0 f(x)', code: '\\lim_{x \\to 0} f(x)' },
    { label: 'Limit Tak Hingga', preview: 'lim n→∞ a_n', code: '\\lim_{n \\to \\infty} a_n' },
    { label: 'Limit Kiri', preview: 'lim x→a⁻ f(x)', code: '\\lim_{x \\to a^-} f(x)' },
    { label: 'Limit Kanan', preview: 'lim x→a⁺ f(x)', code: '\\lim_{x \\to a^+} f(x)' },
    { label: 'Limsup', preview: 'limsup x_n', code: '\\limsup_{n \\to \\infty} x_n' },
  ],
  Integral: [
    { label: 'Integral Tak Tentu', preview: '∫ f(x) dx', code: '\\int f(x) \\, dx' },
    { label: 'Integral Tentu', preview: '∫_a^b f(x) dx', code: '\\int_{a}^{b} f(x) \\, dx' },
    { label: 'Integral Lipat Dua', preview: '∬_D f(x,y) dA', code: '\\iint_{D} f(x, y) \\, dA' },
    { label: 'Integral Kontur', preview: '∮_C F · dr', code: '\\oint_{C} \\vec{F} \\cdot d\\vec{r}' },
    { label: 'Turunan Parsial', preview: '∂f / ∂x', code: '\\frac{\\partial f}{\\partial x}' },
  ],
  Factor: [
    { label: 'Pecahan (Fraction)', preview: 'a / b', code: '\\frac{a}{b}' },
    { label: 'Kombinasi / Binomial', preview: '(n k)', code: '\\binom{n}{k}' },
    { label: 'Akar Kuadrat', preview: '√x', code: '\\sqrt{x}' },
    { label: 'Akar ke-n', preview: 'ⁿ√x', code: '\\sqrt[n]{x}' },
    { label: 'Faktorial', preview: 'n!', code: 'n!' },
    { label: 'Persamaan Polinomial', preview: 'a x² + b x + c = 0', code: 'ax^2 + bx + c = 0' },
  ],
  Vector: [
    { label: 'Vektor Panah', preview: 'v⃗', code: '\\vec{v}' },
    { label: 'Vektor Tebal', preview: 'A', code: '\\mathbf{A}' },
    { label: 'Unit Vector Hat', preview: 'û', code: '\\hat{u}' },
    { label: 'Dot Product', preview: 'u · v', code: '\\vec{u} \\cdot \\vec{v}' },
    { label: 'Cross Product', preview: 'u × v', code: '\\vec{u} \\times \\vec{v}' },
    {
      label: 'Matriks 2x2',
      preview: '[a b; c d]',
      code: '\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}',
    },
    {
      label: 'Matriks Kurung Siku',
      preview: '⎡a b; c d⎤',
      code: '\\begin{bmatrix}\n  a & b \\\\\n  c & d\n\\end{bmatrix}',
    },
  ],
  Trig: [
    { label: 'Sinus', preview: 'sin(θ)', code: '\\sin(\\theta)' },
    { label: 'Cosinus', preview: 'cos(θ)', code: '\\cos(\\theta)' },
    { label: 'Tangen', preview: 'tan(θ)', code: '\\tan(\\theta)' },
    { label: 'Arcsinus', preview: 'arcsin(x)', code: '\\arcsin(x)' },
    { label: 'Identitas Pythagoras', preview: 'sin²θ + cos²θ = 1', code: '\\sin^2(\\theta) + \\cos^2(\\theta) = 1' },
    { label: 'Pi & Theta', preview: 'π, θ', code: '\\pi, \\theta' },
  ],
}

export const MathPalettePopover: React.FC<MathPalettePopoverProps> = ({
  isLatex = true,
  onInsert,
  onClose,
}) => {
  const [mode, setMode] = useState<'inline' | 'display'>('inline')
  const [activeCategory, setActiveCategory] = useState<MathCategory>('Limit')

  const categories: MathCategory[] = ['Limit', 'Integral', 'Factor', 'Vector', 'Trig']

  const handleSelectFormula = (rawCode: string) => {
    let finalCode = rawCode

    if (isLatex) {
      if (mode === 'inline') {
        // LaTeX recommended standard inline delimiter: \( ... \)
        finalCode = `\\(${rawCode}\\)`
      } else {
        // LaTeX recommended standard display math: \[ ... \] or \begin{equation}
        finalCode = `\n\\[\n  ${rawCode}\n\\]\n`
      }
    } else {
      // Markdown standard
      if (mode === 'inline') {
        finalCode = `$${rawCode}$`
      } else {
        finalCode = `\n$$\n${rawCode}\n$$\n`
      }
    }

    onInsert(finalCode)
    onClose()
  }

  return (
    <div className="w-96 bg-white border border-stone-300 rounded-lg shadow-2xl text-stone-800 select-none">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 bg-stone-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-700">Tipe Math:</span>
          <div className="flex bg-stone-200 p-0.5 rounded text-[11px]">
            <button
              type="button"
              onClick={() => setMode('inline')}
              title={isLatex ? 'Inline: \\( ... \\)' : 'Inline: $ ... $'}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mode === 'inline'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Inline {isLatex ? '\\( ... \\)' : '$ ... $'}
            </button>
            <button
              type="button"
              onClick={() => setMode('display')}
              title={isLatex ? 'Display: \\[ ... \\]' : 'Display: $$ ... $$'}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mode === 'display'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Display {isLatex ? '\\[ ... \\]' : '$$ ... $$'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Delimiter Info Hint */}
      <div className="px-3 py-1 bg-stone-100 text-[10px] text-stone-500 border-b border-stone-200 flex justify-between font-mono">
        <span>
          {mode === 'inline' ? 'Posisi: di dalam kalimat (kompak)' : 'Posisi: baris terpusat sendiri (penuh)'}
        </span>
        <span className="text-indigo-600 font-semibold">
          {isLatex
            ? mode === 'inline'
              ? 'Delimiter: \\( ... \\)'
              : 'Delimiter: \\[ ... \\]'
            : mode === 'inline'
            ? 'Delimiter: $...$'
            : 'Delimiter: $$...$$'}
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-stone-200 bg-stone-50 px-2 gap-1 overflow-x-auto text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Formula Item List */}
      <div className="p-2 max-h-56 overflow-y-auto space-y-1">
        {FORMULAS_BY_CATEGORY[activeCategory].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectFormula(item.code)}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-indigo-50 border border-stone-200/60 hover:border-indigo-200 transition-colors text-left group"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-stone-800 group-hover:text-indigo-900">
                {item.label}
              </span>
              <span className="text-[11px] font-mono text-stone-500 group-hover:text-indigo-600">
                {item.preview}
              </span>
            </div>
            <code className="text-[10px] bg-stone-100 group-hover:bg-indigo-100 text-stone-600 group-hover:text-indigo-700 px-1.5 py-0.5 rounded font-mono shrink-0">
              {item.code.slice(0, 18)}...
            </code>
          </button>
        ))}
      </div>
    </div>
  )
}
