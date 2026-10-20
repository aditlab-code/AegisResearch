export interface ScannedLabel {
  key: string;
  category: "table" | "figure" | "equation" | "custom";
  lineNumber: number;
  lineText: string;
}

export function scanDocumentLabels(content: string): ScannedLabel[] {
  if (!content) return [];
  const labels: ScannedLabel[] = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const labelMatch =
      line.match(/\\label\{([^}]+)\}/) || line.match(/\{#([^}]+)\}/);
    if (labelMatch) {
      const key = labelMatch[1].trim();
      let category: ScannedLabel["category"] = "custom";

      if (
        key.startsWith("tab:") ||
        key.startsWith("table:") ||
        key.startsWith("tbl:")
      ) {
        category = "table";
      } else if (key.startsWith("fig:") || key.startsWith("figure:")) {
        category = "figure";
      } else if (key.startsWith("eq:") || key.startsWith("equation:")) {
        category = "equation";
      }

      labels.push({
        key,
        category,
        lineNumber: index + 1,
        lineText: line.trim(),
      });
    }
  });

  return labels;
}
