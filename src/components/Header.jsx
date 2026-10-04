import { Code2, FolderSearch, Sparkles } from "lucide-react";
import "./Header.css";

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-badge">
        <Sparkles size={16} />
        DevSure Analyzer
      </div>

      <div className="header-content">
        <div className="header-copy">
          <div className="header-kicker">
            <Code2 size={17} /> Local project intelligence
          </div>
          <h1>Analyze Your Codebase <span>Understand Your Project</span></h1>
          <p>
            Analyze a local project folder, inspect its structure, and extract
            JavaScript / TypeScript code summaries from the backend.
          </p>
        </div>

        <div className="header-visual" aria-hidden="true">
          <div className="visual-code visual-code-left">&lt;/&gt;</div>
          <div className="visual-code visual-code-right">TS</div>
          <div className="folder-layer folder-layer-back" />
          <div className="folder-layer folder-layer-front">
            <FolderSearch size={82} strokeWidth={1.45} />
          </div>
        </div>
      </div>
    </header>
  );
}
