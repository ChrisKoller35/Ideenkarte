import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertProjektDatei, findProjektDateien, listKarten, updateKarte } from './cards';

let tmp: string;

async function write(rel: string, content: string) {
  const abs = path.join(tmp, ...rel.split('/'));
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content);
}

beforeAll(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ideenkarte-cards-'));
  await write(
    'Story/projekt.json',
    '{\r\n  "name": "Story",\r\n  "status": "aktiv",\r\n  "markierung": "mehr-ki",\r\n  "neu": [1]\r\n}\r\n',
  );
  await write('Story/Unter/projekt.json', '{"name": "soll nicht gefunden werden"}');
  await write('Tief/A/B/projekt.json', '{"name": "Tief"}');
  await write('node_modules/x/projekt.json', '{"name": "ignoriert"}');
  await write('Kaputt/projekt.json', '{ nicht json');
});

afterAll(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe('findProjektDateien', () => {
  it('findet Projekte in der Tiefe, aber nicht in Unterordnern eines Projekts', async () => {
    const found = (await findProjektDateien(tmp)).map((f) => path.relative(tmp, f));
    expect(found.sort()).toEqual(
      [
        path.join('Kaputt', 'projekt.json'),
        path.join('Story', 'projekt.json'),
        path.join('Tief', 'A', 'B', 'projekt.json'),
      ].sort(),
    );
  });
  it('respektiert die maximale Tiefe', async () => {
    const found = await findProjektDateien(tmp, 1);
    expect(found.some((f) => f.includes('Tief'))).toBe(false);
  });
});

describe('listKarten', () => {
  it('liefert kaputte Dateien als Karte mit Fehler', async () => {
    const karten = await listKarten(tmp);
    const kaputt = karten.find((k) => k.ordner.endsWith('Kaputt'));
    expect(kaputt?.info).toBeNull();
    expect(kaputt?.fehler).toBeTruthy();
  });
});

describe('updateKarte', () => {
  it('schreibt Markierung zurück und behält Zeilenenden und andere Felder', async () => {
    const datei = path.join(tmp, 'Story', 'projekt.json');
    const karte = await updateKarte(tmp, datei, { markierung: 'mehr-ich', status: 'pausiert' });
    expect(karte.info?.markierung).toBe('mehr-ich');
    expect(karte.info?.status).toBe('pausiert');
    const raw = await fs.readFile(datei, 'utf8');
    expect(raw).toContain('\r\n');
    expect(raw.endsWith('}\r\n')).toBe(true);
    expect(JSON.parse(raw).neu).toEqual([1]);
    expect(JSON.parse(raw).markierungGeprueft).toBe(true);
  });
  it('verweigert Dateien ausserhalb des Wurzelordners oder mit anderem Namen', () => {
    expect(() => assertProjektDatei(tmp, path.join(tmp, '..', 'projekt.json'))).toThrow();
    expect(() => assertProjektDatei(tmp, path.join(tmp, 'Story', 'package.json'))).toThrow();
  });
});
