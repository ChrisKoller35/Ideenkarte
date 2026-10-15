import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyFile, readFile, readTree, resolveInside } from './files';

let tmp: string;

beforeAll(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ideenkarte-'));
  await fs.mkdir(path.join(tmp, 'Story', 'Erzaehler'), { recursive: true });
  await fs.mkdir(path.join(tmp, '.git'), { recursive: true });
  await fs.writeFile(path.join(tmp, 'README.md'), '# Hallo');
  await fs.writeFile(path.join(tmp, 'Story', 'Erzaehler', '01.md'), '# Kapitel 1');
  await fs.writeFile(path.join(tmp, 'bild.png'), Buffer.from([0, 1, 2]));
});

afterAll(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('readTree', () => {
  it('baut den Baum, ignoriert .git und sortiert Ordner zuerst', async () => {
    const tree = await readTree(tmp);
    expect(tree.children?.map((c) => c.name)).toEqual(['Story', 'bild.png', 'README.md']);
    const story = tree.children?.[0];
    expect(story?.children?.[0].name).toBe('Erzaehler');
    expect(story?.children?.[0].children?.[0].relPath).toBe('Story/Erzaehler/01.md');
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
});

describe('resolveInside', () => {
  it('verhindert Zugriff ausserhalb des Projekts', () => {
    expect(() => resolveInside(tmp, '../../etc/passwd')).toThrow();
  });
});

describe('classifyFile', () => {
  it('erkennt Dateitypen', () => {
    expect(classifyFile('a.md')).toBe('markdown');
    expect(classifyFile('a.txt')).toBe('text');
    expect(classifyFile('a.png')).toBe('binary');
  });
});
