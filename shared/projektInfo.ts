/**
 * Reine Logik rund um projekt.json: einlesen, Änderungen anwenden, Karten filtern.
 * Keine Node- oder DOM-Abhängigkeiten, damit beide Seiten sie nutzen und testen können.
 */
import {
  MARKIERUNGEN,
  PROJEKT_STATUS,
  type KartenAenderung,
  type NaechsteAufgabe,
  type ProjektInfo,
  type ProjektKarte,
} from './types';

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function aufgaben(value: unknown): NaechsteAufgabe[] {
  if (!Array.isArray(value)) return [];
  const result: NaechsteAufgabe[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const v = item as Record<string, unknown>;
    const text = str(v.text).trim();
    if (!text) continue;
    result.push({ text, wer: v.wer === 'ich' ? 'ich' : 'ki' });
  }
  return result;
}

/**
 * Liest die für die Übersicht wichtigen Felder aus einer geparsten projekt.json.
 * fallbackName wird genutzt, wenn die Datei keinen Namen hat (z.B. der Ordnername).
 * Wirft, wenn der Inhalt kein Objekt ist.
 */
export function parseProjektInfo(data: unknown, fallbackName: string): ProjektInfo {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('projekt.json enthält kein Objekt');
  }
  const v = data as Record<string, unknown>;
  const name = str(v.name).trim() || fallbackName;
  return {
    id: str(v.id) || name,
    name,
    typ: str(v.typ, 'unbekannt'),
    beschreibung: str(v.beschreibung),
    status: str(v.status, 'unbekannt'),
    stand: str(v.stand),
    markierung: str(v.markierung, 'gemischt'),
    markierungGeprueft: v.markierungGeprueft === true,
    repo: typeof v.repo === 'string' && v.repo ? v.repo : null,
    naechsteAufgaben: aufgaben(v.naechsteAufgaben),
    aktualisiert: typeof v.aktualisiert === 'string' ? v.aktualisiert : null,
  };
}

/** Prüft eine Änderung aus der Oberfläche. Unbekannte Werte werden abgelehnt. */
export function validateAenderung(aenderung: KartenAenderung): KartenAenderung {
  const result: KartenAenderung = {};
  if (aenderung.status !== undefined) {
    if (!PROJEKT_STATUS.includes(aenderung.status)) {
      throw new Error(`Unbekannter Status: ${String(aenderung.status)}`);
    }
    result.status = aenderung.status;
  }
  if (aenderung.markierung !== undefined) {
    if (!MARKIERUNGEN.includes(aenderung.markierung)) {
      throw new Error(`Unbekannte Markierung: ${String(aenderung.markierung)}`);
    }
    result.markierung = aenderung.markierung;
  }
  return result;
}

/**
 * Wendet eine Änderung auf den Inhalt einer projekt.json an. Alle anderen Felder und ihre
 * Reihenfolge bleiben erhalten. Eine von Hand gesetzte Markierung gilt als geprüft.
 * heute im Format JJJJ-MM-TT.
 */
export function applyAenderung(
  data: Record<string, unknown>,
  aenderung: KartenAenderung,
  heute: string,
): Record<string, unknown> {
  const sauber = validateAenderung(aenderung);
  const next: Record<string, unknown> = { ...data };
  if (sauber.status !== undefined) next.status = sauber.status;
  if (sauber.markierung !== undefined) {
    next.markierung = sauber.markierung;
    next.markierungGeprueft = true;
  }
  next.aktualisiert = heute;
  next.aktualisiertVon = 'ideenkarte';
  return next;
}

/** Filter der Übersicht. '' = alle. 'ohne-archiv' = alles ausser archiviert. */
export interface KartenFilter {
  markierung: string;
  status: string;
}

export const STANDARD_FILTER: KartenFilter = { markierung: '', status: 'ohne-archiv' };

export function filterKarten(karten: ProjektKarte[], filter: KartenFilter): ProjektKarte[] {
  return karten.filter((karte) => {
    const info = karte.info;
    // Fehlerhafte Dateien immer zeigen, damit sie auffallen.
    if (!info) return true;
    if (filter.markierung && info.markierung !== filter.markierung) return false;
    if (filter.status === 'ohne-archiv') return info.status !== 'archiviert';
    if (filter.status && info.status !== filter.status) return false;
    return true;
  });
}

const STATUS_REIHENFOLGE: Record<string, number> = {
  aktiv: 0,
  idee: 1,
  pausiert: 2,
  fertig: 3,
  archiviert: 4,
};

/** Sortiert Karten: aktive zuerst, dann nach Name. */
export function sortKarten(karten: ProjektKarte[]): ProjektKarte[] {
  const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
  const rang = (k: ProjektKarte) => (k.info ? (STATUS_REIHENFOLGE[k.info.status] ?? 5) : 6);
  const name = (k: ProjektKarte) => k.info?.name ?? k.ordner;
  return [...karten].sort((a, b) => rang(a) - rang(b) || collator.compare(name(a), name(b)));
}

/** Heutiges Datum als JJJJ-MM-TT in lokaler Zeit. */
export function heuteIso(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
