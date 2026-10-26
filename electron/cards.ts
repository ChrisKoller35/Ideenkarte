/**
 * Projekt-Karten: sucht alle projekt.json unterhalb eines Wurzelordners, liest sie und
 * schreibt Änderungen (Status, Markierung) zurück. Geschrieben wird nur in Dateien namens
 * projekt.json, die innerhalb des Wurzelordners liegen.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { KartenAenderung, ProjektKarte } from '../shared/types';
import { isIgnoredName } from '../shared/tree';
import { applyAenderung, heuteIso, parseProjektInfo } from '../shared/projektInfo';

export const PROJEKT_DATEI = 'projekt.json';
/** Wie tief unter dem Wurzelordner gesucht wird (Documents\A\B\C\projekt.json = Tiefe 3). */
export const MAX_TIEFE = 4;
/** Notbremse, damit ein riesiger Ordner die App nicht blockiert. */
const MAX_ORDNER = 5000;

/** Ordner, in die beim Suchen nie hineingeschaut wird (zusätzlich zu IGNORED_NAMES). */
function skipDir(name: string): boolean {
  return isIgnoredName(name) || name.startsWith('.') || name.startsWith('$');
}

/**
 * Findet alle projekt.json unterhalb von root. Hat ein Ordner eine projekt.json, wird in
 * seinen Unterordnern nicht weiter gesucht (ein Projekt = ein Hauptordner).
 */
export async function findProjektDateien(root: string, maxTiefe = MAX_TIEFE): Promise<string[]> {
  const found: string[] = [];
  let besucht = 0;

  async function walk(dir: string, tiefe: number): Promise<void> {
    if (besucht++ > MAX_ORDNER) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // Kein Zugriff (z.B. Systemordner): still überspringen.
    }
    if (entries.some((e) => e.isFile() && e.name.toLowerCase() === PROJEKT_DATEI)) {
      const name = entries.find((e) => e.name.toLowerCase() === PROJEKT_DATEI)!.name;
      found.push(path.join(dir, name));
      return;
    }
    if (tiefe >= maxTiefe) return;
    for (const entry of entries) {
      if (entry.isDirectory() && !skipDir(entry.name)) {
        await walk(path.join(dir, entry.name), tiefe + 1);
      }
    }
  }

  await walk(path.resolve(root), 0);
  return found;
}

/** Liest eine projekt.json als Karte. Fehler landen in der Karte, nicht als Ausnahme. */
export async function readKarte(datei: string): Promise<ProjektKarte> {
  const ordner = path.dirname(datei);
  try {
    const raw = await fs.readFile(datei, 'utf8');
    const info = parseProjektInfo(JSON.parse(stripBom(raw)), path.basename(ordner));
    return { datei, ordner, info };
  } catch (e) {
    return { datei, ordner, info: null, fehler: e instanceof Error ? e.message : String(e) };
  }
}

export async function listKarten(root: string): Promise<ProjektKarte[]> {
  const dateien = await findProjektDateien(root);
  return Promise.all(dateien.map(readKarte));
}

/** Prüft, dass datei eine projekt.json innerhalb von root ist. */
export function assertProjektDatei(root: string, datei: string): string {
  const abs = path.resolve(datei);
  const rootAbs = path.resolve(root);
  // Ein ganzes Laufwerk (z. B. D:\) endet schon mit dem Trenner.
  const prefix = rootAbs.endsWith(path.sep) ? rootAbs : rootAbs + path.sep;
  if (path.basename(abs).toLowerCase() !== PROJEKT_DATEI) {
    throw new Error('Nur projekt.json-Dateien dürfen geändert werden');
  }
  if (!abs.startsWith(prefix)) {
    throw new Error('Die Datei liegt ausserhalb des Wurzelordners');
  }
  return abs;
}

/**
 * Schreibt Status/Markierung in die projekt.json. Die Datei wird direkt vor dem Schreiben
 * frisch gelesen, damit Änderungen von anderer Seite (Manager, Claude) erhalten bleiben.
 */
export async function updateKarte(
  root: string,
  datei: string,
  aenderung: KartenAenderung,
): Promise<ProjektKarte> {
  const abs = assertProjektDatei(root, datei);
  const raw = await fs.readFile(abs, 'utf8');
  const data: unknown = JSON.parse(stripBom(raw));
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('projekt.json enthält kein Objekt');
  }
  const next = applyAenderung(data as Record<string, unknown>, aenderung, heuteIso());
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let text = JSON.stringify(next, null, 2);
  if (eol === '\r\n') text = text.replace(/\n/g, '\r\n');
  if (/\r?\n$/.test(raw)) text += eol;
  // Erst in eine Nachbardatei schreiben und dann umbenennen, damit nie eine halbe Datei entsteht.
  const tmp = `${abs}.tmp`;
  await fs.writeFile(tmp, text, 'utf8');
  await fs.rename(tmp, abs);
  return readKarte(abs);
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
