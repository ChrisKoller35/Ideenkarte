/**
 * Typen, die Hauptprozess (electron/) und Oberfläche (src/) gemeinsam nutzen.
 * Keine Abhängigkeiten zu Node oder zum Browser, damit beide Seiten sie importieren können.
 */

/** Ein registriertes Projekt: ein Ordner auf dem PC. */
export interface Project {
  /** Eindeutige ID (stabil, auch wenn der Name geändert wird). */
  id: string;
  /** Anzeigename, standardmässig der Ordnername. */
  name: string;
  /** Absoluter Pfad zum Projektordner. */
  path: string;
}

/** Ein Knoten im Ordnerbaum eines Projekts. */
export interface TreeNode {
  /** Name der Datei oder des Ordners. */
  name: string;
  /** Pfad relativ zum Projektordner, mit "/" als Trenner. */
  relPath: string;
  kind: 'dir' | 'file';
  /** Nur bei Ordnern: Kinder, Ordner zuerst, dann Dateien, jeweils alphabetisch. */
  children?: TreeNode[];
}

/** Inhalt einer Datei, so wie ihn die Oberfläche bekommt. */
export interface FileContent {
  relPath: string;
  /** 'markdown' wird gerendert, 'text' roh angezeigt, 'binary' nicht angezeigt. */
  kind: 'markdown' | 'text' | 'binary';
  text: string;
}

/** Markierung aus projekt.json: Wer macht im Projekt den grösseren Teil der Arbeit? */
export type Markierung = 'mehr-ich' | 'mehr-ki' | 'gemischt';
export const MARKIERUNGEN: readonly Markierung[] = ['mehr-ich', 'mehr-ki', 'gemischt'];

/** Status aus projekt.json. */
export type ProjektStatus = 'idee' | 'aktiv' | 'pausiert' | 'fertig' | 'archiviert';
export const PROJEKT_STATUS: readonly ProjektStatus[] = [
  'idee',
  'aktiv',
  'pausiert',
  'fertig',
  'archiviert',
];

/** Eine nächste Aufgabe aus projekt.json. */
export interface NaechsteAufgabe {
  text: string;
  wer: 'ich' | 'ki';
}

/**
 * Die für die Übersicht wichtigen Felder einer projekt.json (Schema ideenkarte-projekt/1).
 * Unbekannte Felder bleiben in der Datei erhalten, werden hier aber nicht gebraucht.
 */
export interface ProjektInfo {
  id: string;
  name: string;
  typ: string;
  beschreibung: string;
  status: ProjektStatus | string;
  stand: string;
  markierung: Markierung | string;
  markierungGeprueft: boolean;
  repo: string | null;
  naechsteAufgaben: NaechsteAufgabe[];
  aktualisiert: string | null;
}

/** Eine Karte in der Übersicht: eine gefundene projekt.json. */
export interface ProjektKarte {
  /** Absoluter Pfad zur projekt.json. Dient auch als eindeutiger Schlüssel. */
  datei: string;
  /** Ordner, in dem die projekt.json liegt (Projekt-Hauptordner). */
  ordner: string;
  /** null, wenn die Datei nicht gelesen werden konnte (siehe fehler). */
  info: ProjektInfo | null;
  fehler?: string;
}

/** Änderungen, die die App in eine projekt.json zurückschreiben darf. */
export interface KartenAenderung {
  status?: ProjektStatus;
  markierung?: Markierung;
}

/** Einstellungen der App (gespeichert im Benutzerdaten-Ordner). */
export interface Einstellungen {
  /** Wurzelordner, unter dem nach projekt.json gesucht wird. Standard: Dokumente. */
  wurzelordner: string;
}

/**
 * Die Brücke zwischen Oberfläche und Hauptprozess (siehe electron/preload.ts).
 * Alles, was die Oberfläche vom PC braucht, läuft über diese Schnittstelle.
 */
export interface IdeenkarteApi {
  listProjects(): Promise<Project[]>;
  /** Öffnet den Ordner-Dialog und registriert den gewählten Ordner. null = abgebrochen. */
  addProject(): Promise<Project | null>;
  removeProject(id: string): Promise<void>;
  renameProject(id: string, name: string): Promise<void>;
  readTree(projectId: string): Promise<TreeNode>;
  readFile(projectId: string, relPath: string): Promise<FileContent>;

  getSettings(): Promise<Einstellungen>;
  /** Öffnet den Ordner-Dialog für den Wurzelordner. null = abgebrochen. */
  chooseRootFolder(): Promise<Einstellungen | null>;
  /** Sucht alle projekt.json unterhalb des Wurzelordners. */
  listCards(): Promise<ProjektKarte[]>;
  /** Schreibt Status/Markierung in die projekt.json und liefert die neue Karte. */
  updateCard(datei: string, aenderung: KartenAenderung): Promise<ProjektKarte>;
  /** Registriert den Ordner einer Karte als Projekt (für Baum + Anzeige). */
  openCardProject(datei: string): Promise<Project>;
  /** Öffnet einen Projektordner im Explorer. */
  showFolder(ordner: string): Promise<void>;
}
