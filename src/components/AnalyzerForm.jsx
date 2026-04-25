import { useState } from "react";
import { FolderSearch, Loader2 } from "lucide-react";

export default function AnalyzerForm({ onAnalyze, loading }) {
  const [folderPath, setFolderPath] = useState(
    "Enter fodler path"
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!folderPath.trim()) {
      alert("Please enter a folder path");
      return;
    }

    onAnalyze(folderPath.trim());
  };

  return (
    <form className="analyzer-card" onSubmit={handleSubmit}>
      <div className="form-header">
        <div>
          <h2>Analyze Local Folder</h2>
          <p>Enter the folder path available on your backend machine.</p>
        </div>
      </div>

      <div className="input-group">
        <label>Folder Path</label>

        <div className="path-input-wrapper">
          <FolderSearch size={20} />

          <input
            type="text"
            value={folderPath}
            onChange={(event) => setFolderPath(event.target.value)}
            placeholder="C:/Users/najm/Documents/"
          />
        </div>
      </div>

      <button className="analyze-button" type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="spin" size={18} />
            Analyzing...
          </>
        ) : (
          <>
            <FolderSearch size={18} />
            Analyze Folder
          </>
        )}
      </button>
    </form>
  );
}