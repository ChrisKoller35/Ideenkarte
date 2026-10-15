/**
 * Einstieg des Hauptprozesses: Fenster erstellen, IPC-Kanäle registrieren.
 * Die eigentliche Logik liegt in projects.ts und files.ts.
 */
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import type { KartenAenderung } from '../shared/types';
import { ProjectStore } from './projects';
import { readFile, readTree } from './files';
import { assertProjektDatei, listKarten, readKarte, updateKarte } from './cards';
import { SettingsStore } from './settings';
import { setupUpdater } from './updater';

const store = new ProjectStore(path.join(app.getPath('userData'), 'projects.json'));
const settings = new SettingsStore(path.join(app.getPath('userData'), 'settings.json'), {
  wurzelordner: app.getPath('documents'),
});
/** Ordner, die die Oberfläche im Explorer öffnen darf: gefundene Karten und Projekte. */
const bekannteOrdner = new Set<string>();

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 500,
    title: 'Ideenkarte',
    backgroundColor: '#eef2f3',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setMenuBarVisibility(false);
  // Kompiliert liegt diese Datei unter dist-electron/electron/, der Renderer unter dist/.
  void win.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  return win;
}

async function requireProject(id: string) {
  const project = await store.get(id);
  if (!project) throw new Error('Projekt nicht gefunden');
  return project;
}

function registerIpc(): void {
  ipcMain.handle('projects:list', () => store.list());
  ipcMain.handle('projects:add', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined;
    const result = await dialog.showOpenDialog(win!, {
      title: 'Projektordner wählen',
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return store.add(result.filePaths[0]);
  });
  ipcMain.handle('projects:remove', (_e, id: string) => store.remove(id));
  ipcMain.handle('projects:rename', (_e, id: string, name: string) => store.rename(id, name));
  ipcMain.handle('files:tree', async (_e, id: string) => readTree((await requireProject(id)).path));
  ipcMain.handle('files:read', async (_e, id: string, relPath: string) =>
    readFile((await requireProject(id)).path, relPath),
  );
  registerCardIpc();
}

function registerCardIpc(): void {
  ipcMain.handle('settings:get', () => settings.get());
  ipcMain.handle('settings:chooseRoot', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined;
    const current = await settings.get();
    const result = await dialog.showOpenDialog(win!, {
      title: 'Wurzelordner für Projekte wählen',
      defaultPath: current.wurzelordner,
      properties: ['openDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return settings.set({ wurzelordner: result.filePaths[0] });
  });
  ipcMain.handle('cards:list', async () => {
    const karten = await listKarten((await settings.get()).wurzelordner);
    for (const k of karten) bekannteOrdner.add(path.resolve(k.ordner));
    return karten;
  });
  ipcMain.handle('cards:update', async (_e, datei: string, aenderung: KartenAenderung) =>
    updateKarte((await settings.get()).wurzelordner, datei, aenderung),
  );
  ipcMain.handle('cards:open', async (_e, datei: string) => {
    const abs = assertProjektDatei((await settings.get()).wurzelordner, datei);
    const ordner = path.dirname(abs);
    const project = await store.add(ordner);
    // Neu registriert: den Namen aus der projekt.json statt des Ordnernamens nehmen.
    const karte = await readKarte(abs);
    if (karte.info && project.name === path.basename(ordner)) {
      await store.rename(project.id, karte.info.name);
    }
    return (await store.get(project.id)) ?? project;
  });
  ipcMain.handle('shell:showFolder', async (_e, ordner: string) => {
    const abs = path.resolve(ordner);
    const projekte = await store.list();
    if (!bekannteOrdner.has(abs) && !projekte.some((p) => path.resolve(p.path) === abs)) {
      throw new Error('Unbekannter Ordner');
    }
    const fehler = await shell.openPath(abs);
    if (fehler) throw new Error(fehler);
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  setupUpdater();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
