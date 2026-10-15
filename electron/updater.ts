/**
 * Automatische Updates über GitHub-Releases (electron-updater).
 * Beim Start wird nach einer neuen Version gesucht und sie im Hintergrund geladen.
 * Ist sie bereit, bekommt die Oberfläche "update:ready"; installiert wird beim Klick auf
 * «Neu starten» oder spätestens beim nächsten Beenden der App.
 * Läuft nur in der installierten App, nicht beim Entwickeln.
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

let bereiteVersion: string | null = null;

export function setupUpdater(): void {
  ipcMain.handle('update:status', () => bereiteVersion);
  ipcMain.handle('update:install', () => {
    if (bereiteVersion) autoUpdater.quitAndInstall();
  });
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-downloaded', (info) => {
    bereiteVersion = info.version;
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('update:ready', info.version);
    }
  });
  // Kein Internet oder GitHub nicht erreichbar: still weitermachen, die App läuft trotzdem.
  autoUpdater.on('error', (e) => console.warn('Update-Prüfung fehlgeschlagen:', e.message));
  autoUpdater.checkForUpdates().catch(() => undefined);
}
