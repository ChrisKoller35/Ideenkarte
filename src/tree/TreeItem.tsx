import type { TreeNode } from '../../shared/types';

interface Props {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  selectedPath: string | null;
  onToggleDir: (relPath: string) => void;
  onSelectFile: (relPath: string) => void;
}

/** Entfernt die Endung bei Markdown-Dateien, damit der Baum ruhiger aussieht. */
export function displayName(node: TreeNode): string {
  if (node.kind === 'file') return node.name.replace(/\.(md|markdown)$/i, '');
  return node.name;
}

/** Ein Eintrag im Baum: Ordner (aufklappbar) oder Datei (anklickbar). Rekursiv. */
export function TreeItem({
  node,
  depth,
  expanded,
  selectedPath,
  onToggleDir,
  onSelectFile,
}: Props) {
  const isDir = node.kind === 'dir';
  const isOpen = isDir && expanded.has(node.relPath);
  const isSelected = selectedPath === node.relPath;
  const indent = { paddingLeft: `${0.6 + depth * 1.1}rem` };

  return (
    <li role="treeitem" aria-expanded={isDir ? isOpen : undefined} aria-selected={isSelected}>
      <button
        type="button"
        className={[
          'tree__row',
          isDir ? 'tree__row--dir' : 'tree__row--file',
          isSelected ? 'tree__row--selected' : '',
        ].join(' ')}
        style={indent}
        onClick={() => (isDir ? onToggleDir(node.relPath) : onSelectFile(node.relPath))}
        title={node.relPath}
      >
        <span className={`tree__caret ${isOpen ? 'tree__caret--open' : ''}`} aria-hidden>
          {isDir ? '▸' : ''}
        </span>
        <span className="tree__name">{displayName(node)}</span>
        {isDir && node.children && (
          <span className="tree__count" aria-hidden>
            {node.children.length}
          </span>
        )}
      </button>
      {isDir && isOpen && node.children && node.children.length > 0 && (
        <ul role="group" className="tree__children">
          {node.children.map((child) => (
            <TreeItem
              key={child.relPath}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedPath={selectedPath}
              onToggleDir={onToggleDir}
              onSelectFile={onSelectFile}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
