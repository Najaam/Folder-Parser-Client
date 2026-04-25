import { FolderSearch } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <FolderSearch size={42} />
      </div>

      <h2>No folder analyzed yet</h2>
      <p>
        Enter a local backend folder path and click Analyze Folder to generate
        the folder tree and parse summary.
      </p>
    </div>
  );
}