/**
 * App-Einstellungen, gespeichert als JSON im Benutzerdaten-Ordner
 * (unter Windows: %APPDATA%\ideenkarte\settings.json).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Einstellungen } from '../shared/types';

export class SettingsStore {
  private cache: Einstellungen | null = null;

  constructor(
    private readonly filePath: string,
    private readonly defaults: Einstellungen,
  ) {}

  async get(): Promise<Einstellungen> {
    if (this.cache) return this.cache;
    let stored: Partial<Einstellungen> = {};
    try {
      const parsed: unknown = JSON.parse(await fs.readFile(this.filePath, 'utf8'));
      if (typeof parsed === 'object' && parsed !== null) stored = parsed as Partial<Einstellungen>;
    } catch {
      /* Noch keine Datei: Standardwerte. */
    }
    this.cache = {
      wurzelordner:
        typeof stored.wurzelordner === 'string' && stored.wurzelordner
          ? stored.wurzelordner
          : this.defaults.wurzelordner,
    };
    return this.cache;
  }

  async set(changes: Partial<Einstellungen>): Promise<Einstellungen> {
    const next = { ...(await this.get()), ...changes };
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(next, null, 2), 'utf8');
    this.cache = next;
    return next;
  }
}
