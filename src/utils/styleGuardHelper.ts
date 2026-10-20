/**
 * Helper to safely inject or update bibliography style and preamble packages
 * for LaTeX and Markdown documents.
 */

export type BibliographyStyleChoice = "apa" | "ieee" | { custom: string };

export interface StyleTransformResult {
  content: string;
  changed: boolean;
}

/**
 * Applies or updates citation style and bibliography setup in LaTeX documents.
 * Ensures the appropriate preamble package (e.g. \usepackage{apalike}) is present
 * when using APA, preventing unresolved undefined citations or `?` marks.
 */
export function applyLatexBibliographyStyle(
  docContent: string,
  styleChoice: BibliographyStyleChoice,
  bibFileName = "references",
): StyleTransformResult {
  let content = docContent;
  let changed = false;

  const styleName =
    typeof styleChoice === "string"
      ? styleChoice === "apa"
        ? "apalike"
        : "ieeetr"
      : styleChoice.custom.trim();

  const isApa = styleName === "apalike";

  // 1. Guard Preamble (\usepackage{apalike})
  const apalikePkgRegex =
    /^[ \t]*\\usepackage(\[[^\]]*\])?\{apalike\}[ \t]*\r?\n?/m;
  const docClassRegex = /^[ \t]*\\documentclass(?:\[[^\]]*\])?\{[^}]+\}/m;
  const beginDocRegex = /^[ \t]*\\begin\{document\}/m;

  if (isApa) {
    if (!apalikePkgRegex.test(content)) {
      if (beginDocRegex.test(content)) {
        content = content.replace(
          beginDocRegex,
          `\\usepackage{apalike}\n\\begin{document}`,
        );
        changed = true;
      } else if (docClassRegex.test(content)) {
        content = content.replace(
          docClassRegex,
          (match) => `${match}\n\\usepackage{apalike}`,
        );
        changed = true;
      } else {
        content = `\\usepackage{apalike}\n${content}`;
        changed = true;
      }
    }
  } else {
    // When switching from APA to IEEE / custom non-apalike, remove \usepackage{apalike} to avoid conflicting styles
    if (apalikePkgRegex.test(content)) {
      content = content.replace(apalikePkgRegex, "");
      changed = true;
    }
  }

  // 2. Update or Insert \bibliographystyle and \bibliography
  const bibstyleRegex = /\\bibliographystyle\{[^}]+\}/;
  const bibliographyRegex = /\\bibliography\{[^}]+\}/;
  const endDocRegex = /^[ \t]*\\end\{document\}/m;

  const cleanBibFile = bibFileName.replace(/\.bib$/i, "");
  const newStyleCmd = `\\bibliographystyle{${styleName}}`;
  const newBibCmd = `\\bibliography{${cleanBibFile}}`;

  if (bibstyleRegex.test(content)) {
    content = content.replace(bibstyleRegex, newStyleCmd);
    changed = true;
  }

  if (bibliographyRegex.test(content)) {
    // keep or update bib file
    content = content.replace(bibliographyRegex, newBibCmd);
    changed = true;
  }

  // If neither bibliography command is present in document body, insert before \end{document}
  if (!bibstyleRegex.test(content) && !bibliographyRegex.test(content)) {
    const bibBlock = `\n${newStyleCmd}\n${newBibCmd}\n`;
    if (endDocRegex.test(content)) {
      content = content.replace(endDocRegex, `${bibBlock}\\end{document}`);
      changed = true;
    } else {
      content = `${content.trimEnd()}\n${bibBlock}`;
      changed = true;
    }
  } else if (!bibstyleRegex.test(content)) {
    // Only bibliography exists, insert style right before it
    content = content.replace(
      bibliographyRegex,
      `${newStyleCmd}\n${newBibCmd}`,
    );
    changed = true;
  } else if (!bibliographyRegex.test(content)) {
    // Only style exists, insert bibliography right after it
    content = content.replace(bibstyleRegex, `${newStyleCmd}\n${newBibCmd}`);
    changed = true;
  }

  return { content, changed };
}

/**
 * Applies or updates citation style and references section in Markdown / Pandoc documents.
 */
export function applyMarkdownBibliographyStyle(
  docContent: string,
  styleChoice: BibliographyStyleChoice,
  bibFileName = "references.bib",
): StyleTransformResult {
  let content = docContent;
  let changed = false;

  const cleanBibFile = bibFileName.endsWith(".bib")
    ? bibFileName
    : `${bibFileName}.bib`;
  const cslFile =
    typeof styleChoice === "string"
      ? styleChoice === "apa"
        ? "apa.csl"
        : "ieee.csl"
      : `${styleChoice.custom.trim().replace(/\.csl$/i, "")}.csl`;

  const yamlFrontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const match = content.match(yamlFrontmatterRegex);

  if (match) {
    let yaml = match[1];
    if (/^bibliography:\s*.*$/m.test(yaml)) {
      yaml = yaml.replace(
        /^bibliography:\s*.*$/m,
        `bibliography: ${cleanBibFile}`,
      );
    } else {
      yaml = `${yaml}\nbibliography: ${cleanBibFile}`;
    }

    if (/^csl:\s*.*$/m.test(yaml)) {
      yaml = yaml.replace(/^csl:\s*.*$/m, `csl: ${cslFile}`);
    } else {
      yaml = `${yaml}\ncsl: ${cslFile}`;
    }

    content = content.replace(yamlFrontmatterRegex, `---\n${yaml.trim()}\n---`);
    changed = true;
  } else {
    const frontmatter = `---\nbibliography: ${cleanBibFile}\ncsl: ${cslFile}\n---\n\n`;
    content = `${frontmatter}${content}`;
    changed = true;
  }

  // Ensure references container exists
  if (
    !content.includes('id="refs"') &&
    !content.includes("# References") &&
    !content.includes("## References")
  ) {
    content = `${content.trimEnd()}\n\n## References\n\n<div id="refs"></div>\n`;
    changed = true;
  }

  return { content, changed };
}
