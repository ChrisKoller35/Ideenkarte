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
}
