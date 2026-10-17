import { useCallback, useState } from 'react';
import type { ProjektKarte } from '../shared/types';
import { getApi } from './api';
import { useProjects } from './state/useProjects';
import { useProjectFiles } from './state/useProjectFiles';
import { useCards } from './state/useCards';
import { Overview } from './overview/Overview';
import { ProjectBar } from './projects/ProjectBar';
import { TreeView } from './tree/TreeView';
import { FileViewer } from './viewer/FileViewer';
import { MdFileList } from './mdlist/MdFileList';
import { UpdateBanner } from './update/UpdateBanner';

type Ansicht = 'uebersicht' | 'projekt';

/** Rahmen der App: Übersicht mit Karten oder Projekt-Bereich (Baum links, Anzeige rechts). */
export function App() {
  const [ansicht, setAnsicht] = useState<Ansicht>('uebersicht');
  const [aktionFehler, setAktionFehler] = useState<string | null>(null);
  const [mdListeOffen, setMdListeOffen] = useState(false);
  const closeMdListe = useCallback(() => setMdListeOffen(false), []);
  const cards = useCards();
  const projects = useProjects();
  const files = useProjectFiles(projects.active?.id ?? null);
  const error = aktionFehler ?? projects.error ?? files.error;

  async function openCard(karte: ProjektKarte) {
    try {
      const project = await getApi().openCardProject(karte.datei);
      await projects.showProject(project.id);
      setAktionFehler(null);
      setAnsicht('projekt');
    } catch (e) {
      setAktionFehler(String(e));
    }
  }

  async function showFolder(ordner: string) {
    try {
      await getApi().showFolder(ordner);
    } catch (e) {
      setAktionFehler(String(e));
    }
  }

  return (
    <div className="shell">
      <UpdateBanner />
      {ansicht === 'uebersicht' ? (
        <div className="app app--overview">
          {aktionFehler && <div className="error">{aktionFehler}</div>}
          <Overview cards={cards} onOpen={(k) => void openCard(k)} onShowFolder={showFolder} />
        </div>
      ) : (
        renderProjekt()
      )}
    </div>
  );

  function renderProjekt() {
    return (
      <div className="app">
        <aside className="sidebar">
          <header className="sidebar__header">
            <div className="sidebar__actions">
              <button className="btn btn--ghost back" onClick={() => setAnsicht('uebersicht')}>
                ‹ Übersicht
              </button>
              <button
                className={`btn${mdListeOffen ? ' is-active' : ''}`}
                onClick={() => setMdListeOffen((offen) => !offen)}
                disabled={!files.tree}
                title="Alle MD-Dateien des Projekts anzeigen"
              >
                MD-Dateien
              </button>
            </div>
            <h1 className="brand">Ideenkarte</h1>
          </header>
          <ProjectBar
            projects={projects.projects}
            active={projects.active}
            onSelect={projects.setActiveId}
            onAdd={projects.addProject}
            onRemove={projects.removeProject}
            onRename={projects.renameProject}
          />
          <div className="sidebar__tree">
            <TreeView
              root={files.tree}
              expanded={files.expanded}
              selectedPath={files.selectedPath}
              onToggleDir={files.toggleDir}
              onSelectFile={(relPath) => {
                setMdListeOffen(false);
                void files.selectFile(relPath);
              }}
            />
          </div>
          <footer className="sidebar__footer">
            {projects.active && (
              <button
                className="btn btn--ghost"
                onClick={() => projects.active && void showFolder(projects.active.path)}
              >
                Im Explorer
              </button>
            )}
            <button className="btn btn--ghost" onClick={() => files.reloadTree()}>
              Neu laden
            </button>
          </footer>
        </aside>
        <main className="content">
          {error && <div className="error">{error}</div>}
          {mdListeOffen ? (
            <MdFileList
              root={files.tree}
              selectedPath={files.selectedPath}
              onOpen={(relPath) => {
                setMdListeOffen(false);
                void files.selectFile(relPath);
              }}
              onClose={closeMdListe}
            />
          ) : (
            <FileViewer file={files.file} projectName={projects.active?.name ?? null} />
          )}
        </main>
      </div>
    );
  }
}
