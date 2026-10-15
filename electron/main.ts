/**
 * Einstieg des Hauptprozesses: Fenster erstellen, IPC-Kanäle registrieren.
 * Die eigentliche Logik liegt in projects.ts und files.ts.
 */
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import { ProjectStore } from './projects';
import { readFile, readTree } from './files';

const store = new ProjectStore(path.join(app.getPath('userData'), 'projects.json'));

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
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
