import { useMemo } from 'react';
import type { FileContent } from '../../shared/types';
import { renderMarkdown } from './markdown';

interface Props {
  file: FileContent | null;
  projectName: string | null;
}

/** Die rechte Seite: zeigt die gewählte Datei an. */
export function FileViewer({ file, projectName }: Props) {
  const html = useMemo(
    () => (file && file.kind === 'markdown' ? renderMarkdown(file.text) : ''),
    [file],
  );

  if (!file) {
    return (
      <div className="viewer viewer--empty">
        <p className="viewer__hint">
          {projectName
            ? 'Wähle links einen Eintrag, um ihn hier zu lesen.'
            : 'Füge oben links ein Projekt hinzu, um loszulegen.'}
        </p>
      </div>
    );
  }

  return (
    <div className="viewer">
      <div className="viewer__crumbs">{file.relPath.split('/').join('  ›  ')}</div>
      {file.kind === 'markdown' && (
        <article className="md" dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {file.kind === 'text' && <pre className="viewer__plain">{file.text}</pre>}
      {file.kind === 'binary' && (
        <p className="viewer__hint">Diese Datei kann hier nicht angezeigt werden.</p>
      )}
    </div>
  );
}
