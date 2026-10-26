import { describe, expect, it } from 'vitest';
import { ancestorDirs, findNode, isIgnoredName, sortNodes } from './tree';
import type { TreeNode } from './types';

describe('isIgnoredName', () => {
  it('blendet Werkzeug- und Systemordner aus', () => {
    for (const name of [
      '.git',
      'node_modules',
      '.obsidian',
      '.vscode',
      '.idea',
      'dist',
      'dist-electron',
      '.DS_Store',
      'Thumbs.db',
    ]) {
      expect(isIgnoredName(name), name).toBe(true);
    }
  });
  it('lässt ähnliche, normale Namen stehen', () => {
    for (const name of ['.gitignore', 'Git', 'distanz.md', 'node_modules.md', 'README.md']) {
      expect(isIgnoredName(name), name).toBe(false);
    }
  });
});

describe('sortNodes', () => {
  it('stellt Ordner vor Dateien und sortiert natürlich', () => {
    const nodes: TreeNode[] = [
      { name: 'b.md', relPath: 'b.md', kind: 'file' },
      { name: 'Kapitel 10', relPath: 'Kapitel 10', kind: 'dir', children: [] },
      { name: 'a.md', relPath: 'a.md', kind: 'file' },
      { name: 'Kapitel 2', relPath: 'Kapitel 2', kind: 'dir', children: [] },
    ];
    expect(sortNodes(nodes).map((n) => n.name)).toEqual([
      'Kapitel 2',
      'Kapitel 10',
      'a.md',
      'b.md',
    ]);
  });
  it('sortiert ohne Rücksicht auf Gross-/Kleinschreibung, Umlaute wie ihr Grundbuchstabe', () => {
    const nodes: TreeNode[] = [
      { name: 'Zebra.md', relPath: 'Zebra.md', kind: 'file' },
      { name: 'birne.md', relPath: 'birne.md', kind: 'file' },
      { name: 'Äpfel.md', relPath: 'Äpfel.md', kind: 'file' },
    ];
    expect(sortNodes(nodes).map((n) => n.name)).toEqual(['Äpfel.md', 'birne.md', 'Zebra.md']);
  });
});

describe('ancestorDirs', () => {
  it('liefert alle übergeordneten Ordner', () => {
    expect(ancestorDirs('Story/Erzaehler/01.md')).toEqual(['Story', 'Story/Erzaehler']);
  });
  it('liefert nichts für Dateien auf oberster Ebene', () => {
    expect(ancestorDirs('README.md')).toEqual([]);
  });
});

describe('findNode', () => {
  const root: TreeNode = {
    name: 'root',
    relPath: '',
    kind: 'dir',
    children: [
      {
        name: 'Story',
        relPath: 'Story',
        kind: 'dir',
        children: [{ name: 'a.md', relPath: 'Story/a.md', kind: 'file' }],
      },
    ],
  };
  it('findet verschachtelte Knoten', () => {
    expect(findNode(root, 'Story/a.md')?.name).toBe('a.md');
  });
  it('gibt undefined zurück, wenn nichts passt', () => {
    expect(findNode(root, 'nix')).toBeUndefined();
  });
});
