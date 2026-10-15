/**
 * Zugriff auf die Brücke zum Hauptprozess (siehe electron/preload.ts).
 * Alle Komponenten holen die API hier, nie direkt über `window`.
 */
import type { IdeenkarteApi } from '../shared/types';

declare global {
  interface Window {
    ideenkarte?: IdeenkarteApi;
  }
}

export function getApi(): IdeenkarteApi {
  if (!window.ideenkarte) {
    throw new Error('Die App läuft nicht in Electron (window.ideenkarte fehlt).');
  }
  return window.ideenkarte;
}
