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
};

contextBridge.exposeInMainWorld('ideenkarte', api);
