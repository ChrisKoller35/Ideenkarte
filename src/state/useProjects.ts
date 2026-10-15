import { useCallback, useEffect, useState } from 'react';
import type { Project } from '../../shared/types';
import { getApi } from '../api';

const LAST_PROJECT_KEY = 'ideenkarte.lastProjectId';

function readLastProjectId(): string | null {
  try {
    return localStorage.getItem(LAST_PROJECT_KEY);
  } catch {
    return null;
  }
}

function writeLastProjectId(id: string | null): void {
  try {
    if (id) localStorage.setItem(LAST_PROJECT_KEY, id);
    else localStorage.removeItem(LAST_PROJECT_KEY);
  } catch {
    /* Speicher nicht verfügbar, dann merken wir uns nichts. */
  }
}

/** Projektliste laden, Projekt wählen, hinzufügen, entfernen, umbenennen. */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const list = await getApi().listProjects();
    setProjects(list);
    setActiveId((current) => {
      const wanted = current ?? readLastProjectId();
      if (wanted && list.some((p) => p.id === wanted)) return wanted;
      return list[0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    reload().catch((e: unknown) => setError(String(e)));
  }, [reload]);

  useEffect(() => {
    writeLastProjectId(activeId);
  }, [activeId]);

  const addProject = useCallback(async () => {
    try {
      const project = await getApi().addProject();
      if (project) {
        await reload();
        setActiveId(project.id);
      }
    } catch (e) {
      setError(String(e));
    }
  }, [reload]);

  const removeProject = useCallback(
    async (id: string) => {
      await getApi().removeProject(id);
      if (activeId === id) setActiveId(null);
      await reload();
    },
    [activeId, reload],
  );

  const renameProject = useCallback(
    async (id: string, name: string) => {
      await getApi().renameProject(id, name);
      await reload();
    },
    [reload],
  );

  const active = projects.find((p) => p.id === activeId) ?? null;

  return { projects, active, setActiveId, addProject, removeProject, renameProject, error };
}
