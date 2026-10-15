import { describe, expect, it } from 'vitest';
import { firstHeading, renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('rendert Überschriften und Tabellen', () => {
    const html = renderMarkdown('# Titel\n\n| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<h1>Titel</h1>');
    expect(html).toContain('<table>');
  });
  it('entfernt rohes HTML', () => {
    const html = renderMarkdown('Hallo <script>alert(1)</script> Welt');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Hallo');
  });
});

describe('firstHeading', () => {
  it('liest die erste H1', () => {
    expect(firstHeading('Intro\n\n# Der Titel\n## Unter')).toBe('Der Titel');
  });
  it('gibt null zurück, wenn keine vorhanden', () => {
    expect(firstHeading('nur text')).toBeNull();
  });
});
