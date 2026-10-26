import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyFile, readFile, readTree, resolveInside } from './files';
import { findNode } from '../shared/tree';

/** Enthält den Projektordner und daneben Dateien, die die App nie lesen darf. */
let huelle: string;
/** Der Projektordner. */
let tmp: string;

beforeAll(async () => {
  huelle = await fs.mkdtemp(path.join(os.tmpdir(), 'ideenkarte-'));
  tmp = path.join(huelle, 'Projekt');
  await fs.mkdir(path.join(tmp, 'Story', 'Erzaehler'), { recursive: true });
  await fs.mkdir(path.join(tmp, '.git'), { recursive: true });
  await fs.writeFile(path.join(tmp, 'README.md'), '# Hallo');
  await fs.writeFile(path.join(tmp, 'Story', 'Erzaehler', '01.md'), '# Kapitel 1');
  await fs.writeFile(path.join(tmp, 'bild.png'), Buffer.from([0, 1, 2]));
  // Ignorierte Namen tiefer im Baum, ein leerer Ordner, Text und eine zu grosse Datei.
  await fs.mkdir(path.join(tmp, 'Story', 'node_modules', 'paket'), { recursive: true });
  await fs.writeFile(path.join(tmp, 'Story', 'node_modules', 'paket', 'liesmich.md'), '# Paket');
  await fs.writeFile(path.join(tmp, 'Story', 'Thumbs.db'), '');
  await fs.writeFile(path.join(tmp, 'Story', '.DS_Store'), '');
  await fs.mkdir(path.join(tmp, 'Story', 'Leer'));
  await fs.writeFile(path.join(tmp, 'Story', 'werte.JSON'), '{"a": 1}');
  await fs.writeFile(path.join(tmp, 'Story', 'gross.md'), 'x'.repeat(2 * 1024 * 1024 + 1));
  // Neben dem Projekt: eine Datei und ein Ordner, dessen Name gleich anfängt wie «Projekt».
  await fs.writeFile(path.join(huelle, 'geheim.md'), '# Geheim');
  await fs.mkdir(path.join(huelle, 'Projekt-geheim'));
  await fs.writeFile(path.join(huelle, 'Projekt-geheim', 'notiz.md'), '# Geheim');
  // Verknüpfung im Projekt nach draussen ('junction' klappt unter Windows ohne Adminrechte).
  const link = path.join(tmp, 'Story', 'Link');
  await fs.symlink(path.join(huelle, 'Projekt-geheim'), link, 'junction');
});

afterAll(async () => {
  await fs.rm(huelle, { recursive: true, force: true });
});

describe('readTree', () => {
  it('baut den Baum, ignoriert .git und sortiert Ordner zuerst', async () => {
    const tree = await readTree(tmp);
    expect(tree.children?.map((c) => c.name)).toEqual(['Story', 'bild.png', 'README.md']);
    const story = tree.children?.[0];
    expect(story?.children?.[0].name).toBe('Erzaehler');
    expect(story?.children?.[0].children?.[0].relPath).toBe('Story/Erzaehler/01.md');
  });
  it('lässt ignorierte Namen auch tiefer im Baum weg und zeigt leere Ordner', async () => {
    const tree = await readTree(tmp);
    expect(findNode(tree, 'Story')?.children?.map((c) => c.name)).toEqual([
      'Erzaehler',
      'Leer',
      'gross.md',
      'werte.JSON',
    ]);
    expect(findNode(tree, 'Story/Leer')?.children).toEqual([]);
  });
  it('folgt keiner Verknüpfung nach draussen', async () => {
    const tree = await readTree(tmp);
    expect(findNode(tree, 'Story/Link')).toBeUndefined();
    expect(JSON.stringify(tree)).not.toContain('notiz.md');
  });
});

describe('readFile', () => {
  it('liest Markdown', async () => {
    const file = await readFile(tmp, 'Story/Erzaehler/01.md');
    expect(file.kind).toBe('markdown');
    expect(file.text).toBe('# Kapitel 1');
  });
  it('liefert bei Binärdateien keinen Text', async () => {
    const file = await readFile(tmp, 'bild.png');
    expect(file.kind).toBe('binary');
    expect(file.text).toBe('');
  });
  it('liest Textdateien roh, auch mit grosser Endung', async () => {
    const file = await readFile(tmp, 'Story/werte.JSON');
    expect(file).toEqual({ relPath: 'Story/werte.JSON', kind: 'text', text: '{"a": 1}' });
  });
  it('zeigt bei zu grossen Dateien nur einen Hinweis', async () => {
    const file = await readFile(tmp, 'Story/gross.md');
    expect(file.kind).toBe('text');
    expect(file.text).toMatch(/zu gross/);
  });
  it('liest keine Datei ausserhalb des Projekts, auch wenn es sie gibt', async () => {
    await expect(readFile(tmp, '../geheim.md')).rejects.toThrow(/ausserhalb des Projekts/);
    await expect(readFile(tmp, '../Projekt-geheim/notiz.md')).rejects.toThrow(/ausserhalb/);
  });
});

/** true, wenn resolveInside den Pfad ablehnt oder im Projekt auflöst, also nie ausserhalb. */
function nieAusserhalb(relPath: string): boolean {
  let ziel: string;
  try {
    ziel = resolveInside(tmp, relPath);
  } catch {
    return true;
  }
  const rest = path.relative(tmp, ziel);
  return rest !== '..' && !rest.startsWith(`..${path.sep}`) && !path.isAbsolute(rest);
}

describe('resolveInside', () => {
  it('verhindert Zugriff ausserhalb des Projekts', () => {
    expect(() => resolveInside(tmp, '../../etc/passwd')).toThrow();
  });
  it('lehnt jeden Weg mit «..» aus dem Projekt hinaus ab', () => {
    for (const rel of ['..', '../', '../geheim.md', 'Story/../../geheim.md', './Story/./../../x']) {
      expect(() => resolveInside(tmp, rel), rel).toThrow(/ausserhalb des Projekts/);
    }
  });
  it('lehnt einen Nachbarordner ab, dessen Name gleich anfängt', () => {
    expect(() => resolveInside(tmp, '../Projekt-geheim/notiz.md')).toThrow(/ausserhalb/);
  });
  it('löst «..» auf, das im Projekt bleibt', () => {
    const ziel = resolveInside(tmp, 'Story/Erzaehler/../../README.md');
    expect(ziel).toBe(path.join(tmp, 'README.md'));
  });
  it('erlaubt den Projektordner selbst', () => {
    expect(resolveInside(tmp, '')).toBe(path.resolve(tmp));
  });
  it('kommt auch mit absoluten Pfaden, Laufwerken und Backslashes nie hinaus', () => {
    for (const rel of [
      '/etc/passwd',
      'C:/Windows/win.ini',
      'C:\\Windows\\win.ini',
      '\\\\server\\freigabe\\x.md',
      '..\\geheim.md',
      'Story\\..\\..\\geheim.md',
      '%2e%2e/geheim.md',
    ]) {
      expect(nieAusserhalb(rel), rel).toBe(true);
    }
  });
  it('funktioniert, wenn das Projekt ein ganzes Laufwerk ist (z. B. D:\\)', () => {
    const laufwerk = path.parse(tmp).root;
    const ziel = resolveInside(laufwerk, 'Ideen/notiz.md');
    expect(ziel).toBe(path.join(laufwerk, 'Ideen', 'notiz.md'));
  });
});

describe('classifyFile', () => {
  it('erkennt Dateitypen', () => {
    expect(classifyFile('a.md')).toBe('markdown');
    expect(classifyFile('a.txt')).toBe('text');
    expect(classifyFile('a.png')).toBe('binary');
  });
  it('achtet nicht auf Gross-/Kleinschreibung der Endung', () => {
    expect(classifyFile('NOTIZ.MD')).toBe('markdown');
    expect(classifyFile('x.Markdown')).toBe('markdown');
    expect(classifyFile('Daten.YML')).toBe('text');
  });
  it('zeigt Dateien ohne bekannte Endung nicht an, z. B. .env', () => {
    expect(classifyFile('.env')).toBe('binary');
    expect(classifyFile('README')).toBe('binary');
    expect(classifyFile('bild.md.png')).toBe('binary');
  });
});
