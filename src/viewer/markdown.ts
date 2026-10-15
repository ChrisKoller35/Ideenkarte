/**
 * Markdown → HTML. Gekapselt, damit die Bibliothek später austauschbar bleibt.
 * HTML aus den Dateien wird entfernt (nur Markdown-Elemente werden gerendert),
 * damit keine Scripts aus einem Projektordner in der App laufen.
 */
import { marked } from 'marked';

marked.use({ gfm: true, breaks: false });

function stripHtmlTags(markdown: string): string {
  // Entfernt rohe HTML-Blöcke/-Tags, lässt Markdown-Syntax wie `<` in Code unangetastet,
  // weil Code-Blöcke von marked ohnehin escaped werden.
  return markdown.replace(/<\/?[a-zA-Z][^>]*>/g, '');
}

export function renderMarkdown(markdown: string): string {
  const safeSource = stripHtmlTags(markdown);
  return marked.parse(safeSource, { async: false }) as string;
}

/** Erste Überschrift einer Markdown-Datei, als Titel für die Anzeige. */
export function firstHeading(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}
