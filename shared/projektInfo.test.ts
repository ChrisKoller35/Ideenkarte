import { describe, expect, it } from 'vitest';
import {
  applyAenderung,
  filterKarten,
  heuteIso,
  parseProjektInfo,
  sortKarten,
  STANDARD_FILTER,
  validateAenderung,
} from './projektInfo';
import type { KartenAenderung, ProjektKarte } from './types';

function karte(name: string, status: string, markierung: string): ProjektKarte {
  return {
    datei: `/docs/${name}/projekt.json`,
    ordner: `/docs/${name}`,
    info: parseProjektInfo({ name, status, markierung }, name),
  };
}

describe('parseProjektInfo', () => {
  it('liest die Felder und filtert kaputte Aufgaben', () => {
    const info = parseProjektInfo(
      {
        name: 'D&D',
        typ: 'story',
        status: 'aktiv',
        markierung: 'mehr-ich',
        markierungGeprueft: true,
        repo: 'https://github.com/x/y',
        naechsteAufgaben: [{ text: 'Session vorbereiten', wer: 'ich' }, { wer: 'ki' }, 'falsch'],
      },
      'Ordner',
    );
    expect(info.name).toBe('D&D');
    expect(info.markierungGeprueft).toBe(true);
    expect(info.naechsteAufgaben).toEqual([{ text: 'Session vorbereiten', wer: 'ich' }]);
  });
  it('nimmt Ordnernamen und Standardwerte, wenn Felder fehlen', () => {
    const info = parseProjektInfo({}, 'Ordner');
    expect(info.name).toBe('Ordner');
    expect(info.markierung).toBe('gemischt');
    expect(info.repo).toBeNull();
  });
  it('wirft bei Nicht-Objekten', () => {
    expect(() => parseProjektInfo([], 'x')).toThrow();
  });
});

describe('applyAenderung', () => {
  it('ändert nur Status/Markierung und behält alle anderen Felder in Reihenfolge', () => {
    const data = {
      schema: 'ideenkarte-projekt/1',
      status: 'aktiv',
      markierung: 'mehr-ki',
      extra: 1,
    };
    const next = applyAenderung(data, { markierung: 'mehr-ich' }, '2026-10-15');
    expect(Object.keys(next).slice(0, 4)).toEqual(['schema', 'status', 'markierung', 'extra']);
    expect(next.markierung).toBe('mehr-ich');
    expect(next.markierungGeprueft).toBe(true);
    expect(next.status).toBe('aktiv');
    expect(next.aktualisiert).toBe('2026-10-15');
    expect(next.aktualisiertVon).toBe('ideenkarte');
  });
  it('lehnt unbekannte Werte ab', () => {
    const bad = { status: 'kaputt' } as unknown as KartenAenderung;
    expect(() => applyAenderung({}, bad, '2026-10-15')).toThrow();
  });
  it('lässt bei reiner Status-Änderung die Prüfung offen und das Original unverändert', () => {
    const data = { status: 'aktiv', markierungGeprueft: false };
    const next = applyAenderung(data, { status: 'fertig' }, '2026-10-26');
    expect(next.status).toBe('fertig');
    expect(next.markierungGeprueft).toBe(false);
    expect(data.status).toBe('aktiv');
  });
});

describe('validateAenderung', () => {
  it('lässt nur Status und Markierung durch, nie andere Felder', () => {
    const roh = { status: 'aktiv', name: 'Neu', repo: 'x' } as unknown as KartenAenderung;
    expect(validateAenderung(roh)).toEqual({ status: 'aktiv' });
  });
  it('lehnt eine unbekannte Markierung ab', () => {
    const bad = { markierung: 'nur-ki' } as unknown as KartenAenderung;
    expect(() => validateAenderung(bad)).toThrow(/Markierung/);
  });
});

describe('filterKarten', () => {
  const karten = [
    karte('A', 'aktiv', 'mehr-ki'),
    karte('B', 'archiviert', 'mehr-ki'),
    karte('C', 'pausiert', 'mehr-ich'),
  ];
  it('blendet standardmässig Archiviertes aus', () => {
    expect(filterKarten(karten, STANDARD_FILTER).map((k) => k.info?.name)).toEqual(['A', 'C']);
  });
  it('filtert nach Markierung und Status', () => {
    expect(filterKarten(karten, { markierung: 'mehr-ki', status: '' })).toHaveLength(2);
    expect(filterKarten(karten, { markierung: '', status: 'pausiert' })).toHaveLength(1);
  });
  it('zeigt fehlerhafte Karten immer', () => {
    const kaputt: ProjektKarte = {
      datei: '/x/projekt.json',
      ordner: '/x',
      info: null,
      fehler: 'x',
    };
    expect(filterKarten([kaputt], { markierung: 'mehr-ich', status: 'aktiv' })).toHaveLength(1);
  });
});

describe('sortKarten', () => {
  it('stellt aktive Projekte nach vorne', () => {
    const sorted = sortKarten([karte('Z', 'pausiert', 'x'), karte('B', 'aktiv', 'x')]);
    expect(sorted.map((k) => k.info?.name)).toEqual(['B', 'Z']);
  });
  it('sortiert Namen natürlich, unbekannter Status und kaputte Karten kommen ans Ende', () => {
    const kaputt: ProjektKarte = { datei: '/k/projekt.json', ordner: '/k', info: null };
    const sorted = sortKarten([
      kaputt,
      karte('Projekt 10', 'aktiv', 'x'),
      karte('Neu', 'unbekannt', 'x'),
      karte('Projekt 2', 'aktiv', 'x'),
    ]);
    expect(sorted.map((k) => k.info?.name ?? 'kaputt')).toEqual([
      'Projekt 2',
      'Projekt 10',
      'Neu',
      'kaputt',
    ]);
  });
});

describe('heuteIso', () => {
  it('formatiert als JJJJ-MM-TT', () => {
    expect(heuteIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
