import type { TreeNode } from './types';

/** Eine Markdown-Datei im Projekt, für die Liste «MD-Dateien». */
export interface MarkdownEintrag {
  /** Dateiname, z. B. "README.md". */
  name: string;
  /** Pfad relativ zum Projektordner, mit "/" als Trenner. */
  relPath: string;
  /** Ordner, in dem die Datei liegt (relativ), "" = oberste Ebene. */
  ordner: string;
}

const MARKDOWN_ENDUNG = /\.(md|markdown)$/i;

export function isMarkdownName(name: string): boolean {
  return MARKDOWN_ENDUNG.test(name);
}

/** Sammelt alle Markdown-Dateien des Baums, sortiert nach Pfad (Zahlen natürlich). */
export function listMarkdownFiles(root: TreeNode): MarkdownEintrag[] {
  const result: MarkdownEintrag[] = [];
  const visit = (node: TreeNode) => {
    if (node.kind === 'file') {
      if (isMarkdownName(node.name)) {
        const cut = node.relPath.lastIndexOf('/');
        result.push({
          name: node.name,
          relPath: node.relPath,
          ordner: cut === -1 ? '' : node.relPath.slice(0, cut),
        });
      }
      return;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(root);
  const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
  return result.sort((a, b) => collator.compare(a.relPath, b.relPath));
}

/** Filtert nach Suchtext im Pfad (ohne Gross-/Kleinschreibung). Mehrere Wörter = alle müssen passen. */
export function filterMarkdownFiles(list: MarkdownEintrag[], query: string): MarkdownEintrag[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return list;
  return list.filter((e) => {
    const pfad = e.relPath.toLowerCase();
    return words.every((w) => pfad.includes(w));
  });
}
