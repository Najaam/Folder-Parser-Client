import { useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { Filter, RefreshCw, Search } from "lucide-react";
import "./FolderTree.css";

export default function FolderTree({ node, onSelectFile, selectedPath, onRefresh, refreshing }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filteredNode = useMemo(() => (node ? filterTree(node, query, filter) : null), [node, query, filter]);
  if (!node) return null;

  return (
    <div className="tree-root">
      <div className="tree-search">
        <Search size={16} />
        <input aria-label="Search files and folders" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files and folders..." />
        <div className="tree-filter-wrap"><button type="button" className={`tree-tool-button ${filter !== "all" ? "active" : ""}`} onClick={() => setFilterOpen((value) => !value)} aria-label="Filter files"><Filter size={15} /></button>
          {filterOpen && <div className="tree-filter-menu" role="menu">{["all", "parsed", "unsupported", "files", "folders"].map((option) => <button key={option} type="button" className={filter === option ? "active" : ""} onClick={() => { setFilter(option); setFilterOpen(false); }}>{option}</button>)}</div>}
        </div>
        <button type="button" className="tree-tool-button" disabled={refreshing} onClick={onRefresh} aria-label="Re-analyze project"><RefreshCw className={refreshing ? "spin" : ""} size={15} /></button>
      </div>
      {!filteredNode ? <p className="tree-no-results">No matching files or folders.</p> :
      <TreeNode
        node={filteredNode}
        level={0}
        onSelectFile={onSelectFile}
        selectedPath={selectedPath}
        forceOpen={Boolean(query.trim())}
      />}
    </div>
  );
}

function filterTree(node, query, filter) {
  const searchTerm = query.trim().toLowerCase();
  const matchingChildren = (node.children || []).map((child) => filterTree(child, query, filter)).filter(Boolean);
  const isFolder = node.type === "folder";
  const parsed = node.parseResult?.parseSuccess === true;
  const unsupported = node.parseResult?.reason === "Unsupported file type";
  const matchesQuery = !searchTerm || node.name?.toLowerCase().includes(searchTerm);
  const matchesFilter = filter === "all" || (filter === "folders" && isFolder) || (filter === "files" && !isFolder) || (filter === "parsed" && parsed) || (filter === "unsupported" && unsupported);
  if ((isFolder && matchingChildren.length) || (matchesQuery && matchesFilter)) return { ...node, children: matchingChildren };
  return null;
}

function TreeNode({ node, level, onSelectFile, selectedPath, forceOpen = false }) {
  const [open, setOpen] = useState(level < 2);

  const isFolder = node.type === "folder";
  const expanded = forceOpen || open;
  const isSelected = selectedPath === node.path;

  const parseSuccess = node.parseResult?.parseSuccess;
  const isUnsupported = node.parseResult?.reason === "Unsupported file type";
  const isParseFailed = !parseSuccess && !isUnsupported && !isFolder;

  const handleClick = () => {
    if (isFolder) {
      setOpen(!open);
      return;
    }

    onSelectFile(node);
  };

  return (
    <div>
      <button
        type="button"
        className={`tree-node ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: `${level * 18 + 10}px` }}
        onClick={handleClick}
      >
        <div className="tree-node-left">
          {isFolder ? (
            expanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )
          ) : (
            <span className="tree-spacer" />
          )}

          {isFolder ? (
            expanded ? (
              <FolderOpen size={18} className="folder-icon" />
            ) : (
              <Folder size={18} className="folder-icon" />
            )
          ) : node.extension === ".js" ||
            node.extension === ".jsx" ||
            node.extension === ".ts" ||
            node.extension === ".tsx" ? (
            <FileCode2 size={17} className="code-icon" />
          ) : (
            <FileText size={17} className="file-icon" />
          )}

          <span className="node-name">{node.name}</span>
        </div>

        {!isFolder && (
          <div className="file-status">
            {parseSuccess && <CheckCircle2 size={15} className="success-icon" />}

            {isParseFailed && (
              <AlertTriangle size={15} className="warning-icon" />
            )}

            {isUnsupported && <XCircle size={15} className="skip-icon" />}
          </div>
        )}
      </button>

      {isFolder && expanded && node.children?.length > 0 && (
        <div className="tree-children">
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
              selectedPath={selectedPath}
              forceOpen={forceOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
