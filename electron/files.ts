/**
 * Lesen des Projektordners: Baum aufbauen und einzelne Dateien laden.
 * Alle Pfade werden gegen den Projektordner geprüft, damit nie etwas ausserhalb gelesen wird.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { FileContent, TreeNode } from '../shared/types';
import { isIgnoredName, sortNodes } from '../shared/tree';

const MARKDOWN_EXT = new Set(['.md', '.markdown']);
const TEXT_EXT = new Set(['.txt', '.json', '.yaml', '.yml', '.csv', '.toml', '.ini', '.cfg']);
const MAX_TEXT_BYTES = 2 * 1024 * 1024;

/** Liest den ganzen Ordnerbaum (ohne ignorierte Ordner wie .git). */
export async function readTree(rootPath: string): Promise<TreeNode> {
  const root: TreeNode = { name: path.basename(rootPath), relPath: '', kind: 'dir', children: [] };
  root.children = await readChildren(rootPath, '');
  return root;
}

async function readChildren(absDir: string, relDir: string): Promise<TreeNode[]> {
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  const nodes: TreeNode[] = [];
  for (const entry of entries) {
    if (isIgnoredName(entry.name)) continue;
    const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        relPath,
        kind: 'dir',
        children: await readChildren(path.join(absDir, entry.name), relPath),
      });
    } else if (entry.isFile()) {
      nodes.push({ name: entry.name, relPath, kind: 'file' });
    }
  }
  return sortNodes(nodes);
}

/** Löst einen relativen Pfad sicher innerhalb des Projektordners auf. */
export function resolveInside(rootPath: string, relPath: string): string {
  const root = path.resolve(rootPath);
  const target = path.resolve(root, ...relPath.split('/'));
  // Ein ganzes Laufwerk (z. B. D:\) endet schon mit dem Trenner.
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (target !== root && !target.startsWith(prefix)) {
    throw new Error(`Pfad liegt ausserhalb des Projekts: ${relPath}`);
  }
  return target;
}

export function classifyFile(name: string): FileContent['kind'] {
  const ext = path.extname(name).toLowerCase();
  if (MARKDOWN_EXT.has(ext)) return 'markdown';
  if (TEXT_EXT.has(ext)) return 'text';
  return 'binary';
}

export async function readFile(rootPath: string, relPath: string): Promise<FileContent> {
  const abs = resolveInside(rootPath, relPath);
  const kind = classifyFile(abs);
  if (kind === 'binary') return { relPath, kind, text: '' };
  const stat = await fs.stat(abs);
  if (stat.size > MAX_TEXT_BYTES) {
    return { relPath, kind: 'text', text: `(Datei zu gross zum Anzeigen: ${stat.size} Bytes)` };
  }
  const text = await fs.readFile(abs, 'utf8');
  return { relPath, kind, text };
}
