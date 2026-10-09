import { PaperSize, PAPER_PRESETS } from '../types'

export function detectLatexPaperSize(content: string): PaperSize {
  if (!content) return 'a4'

  const lower = content.toLowerCase()

  // Check documentclass or geometry package options
  if (lower.includes('f4paper') || lower.includes('foliopaper') || lower.includes('folio')) {
    return 'f4'
  }
  if (lower.includes('letterpaper') || lower.includes('letter')) {
    return 'letter'
  }
  if (lower.includes('a4paper')) {
    return 'a4'
  }

  // Default standard
  return 'a4'
}

export function calculatePaperDimensions(paperSize: PaperSize, zoom = 1.0) {
  const preset = PAPER_PRESETS[paperSize] || PAPER_PRESETS.a4
  return {
    width: Math.round(preset.baseWidthPx * zoom),
    height: Math.round(preset.baseHeightPx * zoom),
    aspectRatio: preset.aspectRatio,
  }
}
