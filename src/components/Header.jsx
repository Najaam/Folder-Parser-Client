import { Code2, Sparkles } from "lucide-react";
import "./Header.css";

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-badge">
        <Sparkles size={16} />
        DevSure Analyzer
      </div>

      <div className="header-content">
        <div className="header-icon">
          <Code2 size={34} />
        </div>

        <div>
          <h1>Folder Structure & Parse Tree Analyzer</h1>
          <p>
            Analyze a local project folder, inspect its structure, and extract
            JavaScript / TypeScript code summaries from the backend.
          </p>
        </div>
      </div>
    </header>
  );
}