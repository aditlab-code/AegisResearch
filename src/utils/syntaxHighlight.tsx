import React from "react";
import { DocKind } from "../types";

export function highlightCodeLine(
  line: string,
  kind: DocKind,
): React.ReactNode {
  if (kind === "md") {
    if (/^#/.test(line)) {
      return <span className="text-sky-300 font-semibold">{line}</span>;
    }
    if (/^[->]/.test(line)) {
      return (
        <>
          <span className="text-amber-300">{line[0]}</span>
          {line.slice(1)}
        </>
      );
    }
    return line;
  }

  return line.split(/(\\[a-zA-Z]+|\{[^}]*\}|\$[^$]+\$)/g).map((part, index) => {
    if (part.startsWith("\\")) {
      return (
        <span key={index} className="text-violet-300">
          {part}
        </span>
      );
    }
    if (part.startsWith("{")) {
      return (
        <span key={index} className="text-emerald-300">
          {part}
        </span>
      );
    }
    if (part.startsWith("$")) {
      return (
        <span key={index} className="text-amber-300">
          {part}
        </span>
      );
    }
    return part;
  });
}
