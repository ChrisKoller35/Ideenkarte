import { useEffect, useMemo, useState } from 'react';
import type { TreeNode } from '../../shared/types';
import { filterMarkdownFiles, listMarkdownFiles } from '../../shared/markdownFiles';

interface Props {
  root: TreeNode | null;
  selectedPath: string | null;
  onOpen: (relPath: string) => void;
  onClose: () => void;
}

/** Liste aller Markdown-Dateien des Projekts mit Ablageort. Klick öffnet die Datei. */
export function MdFileList({ root, selectedPath, onOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const all = useMemo(() => (root ? listMarkdownFiles(root) : []), [root]);
  const shown = useMemo(() => filterMarkdownFiles(all, query), [all, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="mdlist">
      <header className="mdlist__head">
        <h2 className="mdlist__title">MD-Dateien</h2>
        <span className="mdlist__count">
          {shown.length === all.length ? all.length : `${shown.length} von ${all.length}`}
        </span>
        <button className="btn btn--ghost" onClick={onClose} title="Liste schliessen (Esc)">
          Schliessen
        </button>
      </header>
      <input
        className="mdlist__search"
        value={query}
        autoFocus
        placeholder="Suchen (Name oder Ordner) …"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && shown[0]) onOpen(shown[0].relPath);
        }}
        aria-label="MD-Dateien durchsuchen"
      />
      {all.length === 0 ? (
        <p className="viewer__hint">In diesem Projekt gibt es keine MD-Dateien.</p>
      ) : shown.length === 0 ? (
        <p className="viewer__hint">Nichts gefunden.</p>
      ) : (
        <ul className="mdlist__items">
          {shown.map((e) => (
            <li key={e.relPath}>
              <button
                className={`mdlist__item${e.relPath === selectedPath ? ' is-selected' : ''}`}
                onClick={() => onOpen(e.relPath)}
                title={e.relPath}
              >
                <span className="mdlist__name">{e.name}</span>
                <span className="mdlist__path">
                  {e.ordner ? e.ordner.split('/').join('  ›  ') : 'Projektordner'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
