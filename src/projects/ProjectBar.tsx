import { useState } from 'react';
import type { Project } from '../../shared/types';

interface Props {
  projects: Project[];
  active: Project | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

/** Kopfbereich der Seitenleiste: Projekt wählen, hinzufügen, umbenennen, entfernen. */
export function ProjectBar({ projects, active, onSelect, onAdd, onRemove, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startRename() {
    if (!active) return;
    setDraft(active.name);
    setEditing(true);
  }

  function commitRename() {
    if (active && draft.trim() && draft.trim() !== active.name) onRename(active.id, draft);
    setEditing(false);
  }

  function confirmRemove() {
    if (!active) return;
    const ok = window.confirm(
      `«${active.name}» aus der Liste entfernen?\n\nDer Ordner auf dem PC bleibt unverändert.`,
    );
    if (ok) onRemove(active.id);
  }

  return (
    <div className="project-bar">
      <div className="project-bar__row">
        <select
          className="project-bar__select"
          value={active?.id ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          aria-label="Projekt wählen"
          disabled={projects.length === 0}
        >
          {projects.length === 0 && <option value="">Noch kein Projekt</option>}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button className="btn btn--primary" onClick={onAdd} title="Projektordner hinzufügen">
          + Projekt
        </button>
      </div>
      {active && (
        <div className="project-bar__row project-bar__meta">
          {editing ? (
            <input
              className="project-bar__input"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditing(false);
              }}
              aria-label="Neuer Projektname"
            />
          ) : (
            <span className="project-bar__path" title={active.path}>
              {active.path}
            </span>
          )}
          <button className="btn btn--ghost" onClick={startRename} title="Projekt umbenennen">
            Umbenennen
          </button>
          <button className="btn btn--ghost" onClick={confirmRemove} title="Aus Liste entfernen">
            Entfernen
          </button>
        </div>
      )}
    </div>
  );
}
