/**
 * Lesen des Projektordners: Baum aufbauen und einzelne Dateien laden.
 * Alle Pfade werden gegen den Projektordner geprüft, damit nie etwas ausserhalb gelesen wird.
 */
import { promises as fs, realpath } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import type { FileContent, TreeNode } from '../shared/types';
import { isIgnoredName, sortNodes } from '../shared/tree';

const MARKDOWN_EXT = new Set(['.md', '.markdown']);
const TEXT_EXT = new Set(['.txt', '.json', '.yaml', '.yml', '.csv', '.toml', '.ini', '.cfg']);
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
/**
 * Echter Pfad mit aufgelösten Verknüpfungen (Links, Junctions). Bewusst die JS-Variante:
 * fs.promises.realpath ist die native, und die scheitert unter Windows an manchen Laufwerken.
 */
const echterPfad = promisify(realpath);

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
  if (!isInside(root, target)) {
    throw new Error(`Pfad liegt ausserhalb des Projekts: ${relPath}`);
  }
  return target;
}

/** Liegt target im Ordner root oder ist es root selbst? Beide Pfade absolut. */
function isInside(root: string, target: string): boolean {
  // Ein ganzes Laufwerk (z. B. D:\) endet schon mit dem Trenner.
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  return target === root || target.startsWith(prefix);
}

/** Auch über eine Verknüpfung im Pfad darf nichts ausserhalb des Projekts gelesen werden. */
async function assertRealInside(rootPath: string, abs: string, relPath: string): Promise<void> {
  const [realRoot, real] = await Promise.all([echterPfad(rootPath), echterPfad(abs)]);
  if (!isInside(realRoot, real)) {
    throw new Error(`Verknüpfung zeigt ausserhalb des Projekts: ${relPath}`);
  }
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
  await assertRealInside(rootPath, abs, relPath);
  const stat = await fs.stat(abs);
  if (stat.size > MAX_TEXT_BYTES) {
    return { relPath, kind: 'text', text: `(Datei zu gross zum Anzeigen: ${stat.size} Bytes)` };
  }
  const text = await fs.readFile(abs, 'utf8');
  return { relPath, kind, text };
}
