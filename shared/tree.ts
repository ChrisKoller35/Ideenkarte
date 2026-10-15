import type { TreeNode } from './types';

/** Ordner und Dateien, die im Baum nie angezeigt werden. */
export const IGNORED_NAMES = new Set([
  '.git',
  'node_modules',
  '.obsidian',
  '.vscode',
  '.idea',
  'dist',
  'dist-electron',
  '.DS_Store',
  'Thumbs.db',
]);

export function isIgnoredName(name: string): boolean {
  return IGNORED_NAMES.has(name);
}

/** Sortiert Knoten: Ordner vor Dateien, innerhalb alphabetisch (sprachbewusst, Zahlen natürlich). */
export function sortNodes(nodes: TreeNode[]): TreeNode[] {
  const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
  return [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
    return collator.compare(a.name, b.name);
  });
}

/** Liefert alle Ordner-Pfade, die man aufklappen muss, um relPath sichtbar zu machen. */
export function ancestorDirs(relPath: string): string[] {
  const parts = relPath.split('/');
  const result: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    result.push(parts.slice(0, i).join('/'));
  }
  return result;
}

/** Sucht einen Knoten per relPath. */
export function findNode(root: TreeNode, relPath: string): TreeNode | undefined {
  if (root.relPath === relPath) return root;
  for (const child of root.children ?? []) {
    const hit = findNode(child, relPath);
    if (hit) return hit;
  }
  return undefined;
}
