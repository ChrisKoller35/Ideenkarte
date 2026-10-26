import { describe, expect, it } from 'vitest';
import {
  filterMarkdownFiles,
  isMarkdownName,
  isRegelDatei,
  listMarkdownFiles,
} from './markdownFiles';
import type { TreeNode } from './types';

const root: TreeNode = {
  name: 'root',
  relPath: '',
  kind: 'dir',
  children: [
    {
      name: 'Welt',
      relPath: 'Welt',
      kind: 'dir',
      children: [
        { name: 'Kapitel 10.md', relPath: 'Welt/Kapitel 10.md', kind: 'file' },
        { name: 'Kapitel 2.md', relPath: 'Welt/Kapitel 2.md', kind: 'file' },
        { name: 'karte.png', relPath: 'Welt/karte.png', kind: 'file' },
      ],
    },
    { name: 'README.MD', relPath: 'README.MD', kind: 'file' },
    { name: 'notiz.markdown', relPath: 'notiz.markdown', kind: 'file' },
    { name: 'daten.json', relPath: 'daten.json', kind: 'file' },
  ],
};

describe('listMarkdownFiles', () => {
  it('findet nur Markdown-Dateien, auch verschachtelt, sortiert nach Pfad', () => {
    expect(listMarkdownFiles(root).map((e) => e.relPath)).toEqual([
      'notiz.markdown',
      'README.MD',
      'Welt/Kapitel 2.md',
      'Welt/Kapitel 10.md',
    ]);
  });
  it('liefert den Ordner der Datei', () => {
    const list = listMarkdownFiles(root);
    expect(list.find((e) => e.name === 'README.MD')?.ordner).toBe('');
    expect(list.find((e) => e.name === 'Kapitel 2.md')?.ordner).toBe('Welt');
  });
});

describe('filterMarkdownFiles', () => {
  const list = listMarkdownFiles(root);
  it('lässt bei leerer Suche alles stehen', () => {
    expect(filterMarkdownFiles(list, '  ')).toHaveLength(4);
  });
  it('sucht im ganzen Pfad, alle Wörter müssen passen', () => {
    expect(filterMarkdownFiles(list, 'welt 10').map((e) => e.name)).toEqual(['Kapitel 10.md']);
    expect(filterMarkdownFiles(list, 'readme').map((e) => e.name)).toEqual(['README.MD']);
  });
  it('ignoriert Gross-/Kleinschreibung und doppelte Leerzeichen in der Suche', () => {
    expect(filterMarkdownFiles(list, '  WELT   kapitel ')).toHaveLength(2);
    expect(filterMarkdownFiles(list, 'gibtsnicht')).toEqual([]);
  });
});

describe('isMarkdownName', () => {
  it('erkennt .md und .markdown in jeder Schreibweise, sonst nichts', () => {
    expect(isMarkdownName('NOTIZ.MD')).toBe(true);
    expect(isMarkdownName('x.Markdown')).toBe(true);
    expect(isMarkdownName('bild.md.png')).toBe(false);
    expect(isMarkdownName('seite.mdx')).toBe(false);
  });
});

describe('isRegelDatei', () => {
  it('erkennt Regel-, Feedback- und Verhaltensdateien', () => {
    for (const name of [
      'CLAUDE.md',
      'AGENTS.md',
      'MANAGER.md',
      'docs/FEEDBACK.md'.split('/')[1],
      'Regeln.md',
      'Regelwerk.md',
      'RICHTLINIEN.md',
      'verhalten-ki.md',
      'SKILL.md',
      'App-Feedback-2026.md',
    ]) {
      expect(isRegelDatei(name), name).toBe(true);
    }
  });
  it('lässt andere Dateien weg', () => {
    for (const name of ['README.md', 'Kapitel 2.md', 'spellmanager.md', 'GRAFIK.md', 'PLAN.md']) {
      expect(isRegelDatei(name), name).toBe(false);
    }
  });
});
