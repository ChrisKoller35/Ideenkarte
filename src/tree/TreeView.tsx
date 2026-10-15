import type { TreeNode } from '../../shared/types';
import { TreeItem } from './TreeItem';

interface Props {
  root: TreeNode | null;
  expanded: Set<string>;
  selectedPath: string | null;
  onToggleDir: (relPath: string) => void;
  onSelectFile: (relPath: string) => void;
}

/** Der Ordnerbaum links. Zeigt die Kinder des Projektordners. */
export function TreeView({ root, expanded, selectedPath, onToggleDir, onSelectFile }: Props) {
  if (!root) return <div className="tree tree--empty">Kein Projekt geöffnet.</div>;
  if (!root.children || root.children.length === 0) {
    return <div className="tree tree--empty">Dieser Ordner ist leer.</div>;
  }
  return (
    <ul className="tree" role="tree">
      {root.children.map((child) => (
        <TreeItem
          key={child.relPath}
          node={child}
          depth={0}
          expanded={expanded}
          selectedPath={selectedPath}
          onToggleDir={onToggleDir}
          onSelectFile={onSelectFile}
        />
      ))}
    </ul>
  );
}
