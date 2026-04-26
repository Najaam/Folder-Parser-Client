import {
  CheckCircle2,
  Terminal,
  Folder,
  ArrowLeft,
  Rocket,
  FileCheck2
} from "lucide-react";

export default function BuildResultPage({ buildResult, onBack }) {
  return (
    <main className="build-result-page">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to Analysis
      </button>

      <section className="build-success-hero">
        <div className="success-orb">
          <CheckCircle2 size={46} />
        </div>

        <div>
          <span className="success-badge">
            <Rocket size={15} />
            Build Successful
          </span>

          <h1>Project is ready to proceed</h1>

          <p>
            The selected project passed the backend build/syntax check. DevSure
            can now move this project to the next workflow stage.
          </p>
        </div>
      </section>

      <section className="build-result-grid">
        <div className="build-result-card">
          <div className="build-result-card-icon">
            <Folder size={22} />
          </div>

          <p>Folder Path</p>
          <h3>{buildResult?.folderPath || "N/A"}</h3>
        </div>

        <div className="build-result-card">
          <div className="build-result-card-icon">
            <Terminal size={22} />
          </div>

          <p>Executed Command</p>
          <h3>{buildResult?.executedCommand || "N/A"}</h3>
        </div>

        <div className="build-result-card">
          <div className="build-result-card-icon">
            <FileCheck2 size={22} />
          </div>

          <p>Mode</p>
          <h3>{buildResult?.mode || buildResult?.executedScript || "N/A"}</h3>
        </div>
      </section>

      <section className="build-output-panel">
        <div className="panel-header">
          <h2>Build Output</h2>
          <p>{buildResult?.description || "Build completed successfully."}</p>
        </div>

        <pre>
          {buildResult?.output?.trim()
            ? buildResult.output
            : "No output. Command completed successfully."}
        </pre>
      </section>
    </main>
  );
}