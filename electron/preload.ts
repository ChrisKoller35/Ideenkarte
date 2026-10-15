/**
 * Brücke zwischen Oberfläche und Hauptprozess. Die Oberfläche hat keinen direkten
 * Zugriff auf Node oder das Dateisystem; sie sieht nur `window.ideenkarte`.
 */
import { contextBridge, ipcRenderer } from 'electron';
import type { IdeenkarteApi } from '../shared/types';

const api: IdeenkarteApi = {
  listProjects: () => ipcRenderer.invoke('projects:list'),
  addProject: () => ipcRenderer.invoke('projects:add'),
  removeProject: (id) => ipcRenderer.invoke('projects:remove', id),
  renameProject: (id, name) => ipcRenderer.invoke('projects:rename', id, name),
  readTree: (projectId) => ipcRenderer.invoke('files:tree', projectId),
  readFile: (projectId, relPath) => ipcRenderer.invoke('files:read', projectId, relPath),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  chooseRootFolder: () => ipcRenderer.invoke('settings:chooseRoot'),
  listCards: () => ipcRenderer.invoke('cards:list'),
  updateCard: (datei, aenderung) => ipcRenderer.invoke('cards:update', datei, aenderung),
  openCardProject: (datei) => ipcRenderer.invoke('cards:open', datei),
  showFolder: (ordner) => ipcRenderer.invoke('shell:showFolder', ordner),
  getReadyUpdate: () => ipcRenderer.invoke('update:status'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateReady: (callback) => {
    const listener = (_e: unknown, version: string) => callback(version);
    ipcRenderer.on('update:ready', listener);
    return () => ipcRenderer.removeListener('update:ready', listener);
  },
};

contextBridge.exposeInMainWorld('ideenkarte', api);
