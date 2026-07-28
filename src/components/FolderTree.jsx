import { useState } from "react";
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
import "./FolderTree.css";

export default function FolderTree({ node, onSelectFile, selectedPath }) {
  if (!node) return null;

  return (
    <div className="tree-root">
      <TreeNode
        node={node}
        level={0}
        onSelectFile={onSelectFile}
        selectedPath={selectedPath}
      />
    </div>
  );
}

function TreeNode({ node, level, onSelectFile, selectedPath }) {
  const [open, setOpen] = useState(level < 2);

  const isFolder = node.type === "folder";
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
      <div
        className={`tree-node ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: `${level * 18 + 10}px` }}
        onClick={handleClick}
      >
        <div className="tree-node-left">
          {isFolder ? (
            open ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )
          ) : (
            <span className="tree-spacer" />
          )}

          {isFolder ? (
            open ? (
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
      </div>

      {isFolder && open && node.children?.length > 0 && (
        <div>
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}