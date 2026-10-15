/**
 * Verwaltung der Projektliste. Gespeichert als JSON im Benutzerdaten-Ordner der App
 * (unter Windows: %APPDATA%\ideenkarte\projects.json).
 * Diese Datei enthält nur Pfade, nie Inhalte der Projekte.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Project } from '../shared/types';

export class ProjectStore {
  private projects: Project[] = [];
  private loaded = false;

  constructor(private readonly filePath: string) {}

  private async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      this.projects = Array.isArray(parsed) ? parsed.filter(isProject) : [];
    } catch {
      this.projects = [];
    }
    this.loaded = true;
  }

  private async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.projects, null, 2), 'utf8');
  }

  async list(): Promise<Project[]> {
    await this.load();
    return [...this.projects];
  }

  async get(id: string): Promise<Project | undefined> {
    await this.load();
    return this.projects.find((p) => p.id === id);
  }

  /** Fügt einen Ordner hinzu. Ist er schon registriert, wird das bestehende Projekt zurückgegeben. */
  async add(folderPath: string): Promise<Project> {
    await this.load();
    const normalized = path.resolve(folderPath);
    const existing = this.projects.find((p) => path.resolve(p.path) === normalized);
    if (existing) return existing;
    const project: Project = {
      id: randomUUID(),
      name: path.basename(normalized) || normalized,
      path: normalized,
    };
    this.projects.push(project);
    await this.save();
    return project;
  }

  async remove(id: string): Promise<void> {
    await this.load();
    this.projects = this.projects.filter((p) => p.id !== id);
    await this.save();
  }

  async rename(id: string, name: string): Promise<void> {
    await this.load();
    const project = this.projects.find((p) => p.id === id);
    if (!project) return;
    const trimmed = name.trim();
    if (trimmed) project.name = trimmed;
    await this.save();
  }
}

function isProject(value: unknown): value is Project {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string' && typeof v.path === 'string';
}
