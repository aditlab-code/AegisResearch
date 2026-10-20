import { BibEntry } from "./bibtexParser";

function extractSurname(name: string): string {
  const clean = name.trim();
  if (!clean) return "Unknown";

  // Format: "Last, First"
  if (clean.includes(",")) {
    return clean.split(",")[0].trim();
  }

  // Format: "First M. Last"
  const parts = clean.split(/\s+/);
  return parts[parts.length - 1].trim();
}

export function formatAuthorsShort(rawAuthors: string): string {
  if (!rawAuthors) return "Unknown";

  // Split by "and" or ";"
  const authors = rawAuthors
    .split(/\s+and\s+|;/i)
    .map((a) => extractSurname(a))
    .filter(Boolean);

  if (authors.length === 0) return "Unknown";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors[0]} et al.`;
}

export interface FormattedCitationResult {
  formattedText: string;
  isFound: boolean;
  entry?: BibEntry;
  tooltip?: string;
}

export function formatPandocCitation(
  rawText: string,
  bibEntries: BibEntry[] = [],
  csl: "apa" | "ieee" = "apa",
): FormattedCitationResult {
  // Check if in-text citation: @key
  const inTextMatch = rawText.match(/^@([a-zA-Z0-9_\-:]+)$/);
  if (inTextMatch) {
    const key = inTextMatch[1];
    const idx = bibEntries.findIndex(
      (e) => e.key.toLowerCase() === key.toLowerCase(),
    );
    if (idx > -1) {
      const entry = bibEntries[idx];
      const author = formatAuthorsShort(entry.author);
      const year = entry.year || "n.d.";
      const text =
        csl === "ieee" ? `${author} [${idx + 1}]` : `${author} (${year})`;
      return {
        formattedText: text,
        isFound: true,
        entry,
        tooltip: `${entry.title} (${entry.author}, ${entry.year})`,
      };
    }
    return {
      formattedText: `@${key}`,
      isFound: false,
      tooltip: `Citation key '@${key}' not found in references.bib`,
    };
  }

  // Parenthetical citation: [@key] or [@key, p. 12] or [@key1; @key2]
  const bracketMatch = rawText.match(/^\[(.*)\]$/);
  if (!bracketMatch) {
    return { formattedText: rawText, isFound: false };
  }

  const inner = bracketMatch[1].trim();
  const subCitations = inner.split(";").map((s) => s.trim());

  const formattedParts: string[] = [];
  let foundAny = false;
  let firstEntry: BibEntry | undefined;

  for (const sub of subCitations) {
    // Match @key optionally followed by locator like ", p. 12"
    const subMatch = sub.match(/@([a-zA-Z0-9_\-:]+)(.*)/);
    if (!subMatch) {
      formattedParts.push(sub);
      continue;
    }

    const key = subMatch[1].trim();
    const locator = subMatch[2]?.trim() || ""; // e.g. ", p. 12"

    const idx = bibEntries.findIndex(
      (e) => e.key.toLowerCase() === key.toLowerCase(),
    );
    if (idx > -1) {
      foundAny = true;
      const entry = bibEntries[idx];
      if (!firstEntry) firstEntry = entry;

      if (csl === "ieee") {
        const num = idx + 1;
        formattedParts.push(locator ? `${num}${locator}` : `${num}`);
      } else {
        const author = formatAuthorsShort(entry.author);
        const year = entry.year || "n.d.";
        formattedParts.push(`${author}, ${year}${locator}`);
      }
    } else {
      formattedParts.push(`@${key}${locator}`);
    }
  }

  if (csl === "ieee" && foundAny) {
    return {
      formattedText: `[${formattedParts.join(", ")}]`,
      isFound: foundAny,
      entry: firstEntry,
      tooltip: firstEntry
        ? `${firstEntry.title} (${firstEntry.year})`
        : undefined,
    };
  }

  return {
    formattedText: `(${formattedParts.join("; ")})`,
    isFound: foundAny,
    entry: firstEntry,
    tooltip: firstEntry
      ? `${firstEntry.title} (${firstEntry.year})`
      : undefined,
  };
}

export function formatBibReference(
  entry: BibEntry,
  csl: "apa" | "ieee" = "apa",
  index = 1,
): string {
  const author = entry.author || "Anonymous";
  const title = entry.title || "Untitled";
  const year = entry.year || "n.d.";
  const journal = entry.journal ? ` ${entry.journal}.` : "";

  if (csl === "ieee") {
    return `[${index}] ${author}, "${title}," ${journal || entry.publisher || ""} ${year}.`;
  }

  return `${author} (${year}). ${title}.${journal}`;
}
