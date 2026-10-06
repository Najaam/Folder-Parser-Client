import { useState } from "react";
import { FolderOpen, FolderSearch, Info, Loader2, ShieldCheck } from "lucide-react";
import "./AnalyzerForm.css";

export default function AnalyzerForm({ onAnalyze, loading }) {
  const [folderPath, setFolderPath] = useState(
    ""
  );
  const [pickerMessage, setPickerMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!folderPath.trim()) {
      alert("Please enter a folder path");
      return;
    }

    onAnalyze(folderPath.trim());
  };

  const handleBrowse = async () => {
    if (typeof window.showDirectoryPicker !== "function") {
      setPickerMessage("Folder browsing is not supported by this browser. You can still paste the project path.");
      return;
    }

    try {
      const directory = await window.showDirectoryPicker({ mode: "read" });
      setPickerMessage(
        `Selected: ${directory.name}. Your browser keeps the full local path private, so paste it to analyze.`
      );
    } catch (error) {
      if (error?.name !== "AbortError") {
        setPickerMessage("Unable to open the folder picker. You can still enter the project path manually.");
      }
    }
  };

  return (
    <form className="analyzer-card" onSubmit={handleSubmit}>
      <div className="form-header">
        <div className="form-step">
          <span>1</span>
          <div>
          <h2>Select Project Folder</h2>
          <p>Enter the folder path available on your backend machine.</p>
          </div>
        </div>
        <div className="privacy-note">
          <Info size={20} />
          <div>
            <strong>Your code stays on your machine.</strong>
            <span>Analysis runs in your local environment.</span>
          </div>
        </div>
      </div>

      <div className="input-group">
        <label>Project Folder Path</label>

        <div className="path-input-wrapper">
          <FolderSearch className="path-folder-icon" size={20} />

          <input
            type="text"
            value={folderPath}
            onChange={(event) => setFolderPath(event.target.value)}
            placeholder="C:/Users/najm/Documents/"
          />

          <button className="browse-button" type="button" onClick={handleBrowse}>
            <FolderOpen size={17} />
            Browse
          </button>
        </div>
      </div>

      <p className="form-assist"><ShieldCheck size={17} /> Enter the local project directory you want to analyze.</p>
      {pickerMessage && <p className="picker-message" role="status">{pickerMessage}</p>}

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
