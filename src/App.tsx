import { useProjects } from './state/useProjects';
import { useProjectFiles } from './state/useProjectFiles';
import { ProjectBar } from './projects/ProjectBar';
import { TreeView } from './tree/TreeView';
import { FileViewer } from './viewer/FileViewer';

/** Rahmen der App: Seitenleiste (Projekte + Baum) links, Anzeige rechts. */
export function App() {
  const projects = useProjects();
  const files = useProjectFiles(projects.active?.id ?? null);
  const error = projects.error ?? files.error;

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="sidebar__header">
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
            onSelectFile={files.selectFile}
          />
        </div>
        <footer className="sidebar__footer">
          <button className="btn btn--ghost" onClick={() => files.reloadTree()}>
            Neu laden
          </button>
        </footer>
      </aside>
      <main className="content">
        {error && <div className="error">{error}</div>}
        <FileViewer file={files.file} projectName={projects.active?.name ?? null} />
      </main>
    </div>
  );
}
