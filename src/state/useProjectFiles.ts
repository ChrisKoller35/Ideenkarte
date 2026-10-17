import { useCallback, useEffect, useState } from 'react';
import type { FileContent, TreeNode } from '../../shared/types';
import { ancestorDirs } from '../../shared/tree';
import { getApi } from '../api';

/**
 * Baum und gewählte Datei eines Projekts. Wechselt das Projekt, wird alles zurückgesetzt.
 */
export function useProjectFiles(projectId: string | null) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [file, setFile] = useState<FileContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reloadTree = useCallback(async () => {
    if (!projectId) {
      setTree(null);
      return;
    }
    try {
      setTree(await getApi().readTree(projectId));
      setError(null);
    } catch (e) {
      setTree(null);
      setError(String(e));
    }
  }, [projectId]);

  useEffect(() => {
    setExpanded(new Set());
    setSelectedPath(null);
    setFile(null);
    reloadTree().catch(() => undefined);
  }, [reloadTree]);

  const toggleDir = useCallback((relPath: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(relPath)) next.delete(relPath);
      else next.add(relPath);
      return next;
    });
  }, []);

  const selectFile = useCallback(
    async (relPath: string) => {
      if (!projectId) return;
      setSelectedPath(relPath);
      setExpanded((prev) => new Set([...prev, ...ancestorDirs(relPath)]));
      try {
        setFile(await getApi().readFile(projectId, relPath));
        setError(null);
      } catch (e) {
        setFile(null);
        setError(String(e));
      }
    },
    [projectId],
  );

  /** «Neu laden»: Baum und die geöffnete Datei frisch von der Festplatte lesen. */
  const reload = useCallback(async () => {
    await reloadTree();
    if (!projectId || !selectedPath) return;
    try {
      setFile(await getApi().readFile(projectId, selectedPath));
    } catch {
      // Datei gibt es nicht mehr (gelöscht oder umbenannt): Anzeige leeren.
      setSelectedPath(null);
      setFile(null);
    }
  }, [projectId, reloadTree, selectedPath]);

  return { tree, expanded, toggleDir, selectedPath, selectFile, file, error, reload };
}
