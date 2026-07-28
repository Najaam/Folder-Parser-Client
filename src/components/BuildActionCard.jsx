import { Hammer, Loader2, Rocket, AlertTriangle } from "lucide-react";
import "./BuildActionCard.css";

export default function BuildActionCard({
  folderPath,
  onBuild,
  building,
  buildError
}) {
  return (
    <section className="build-action-card">
      <div className="build-action-content">
        <div className="build-action-icon">
          <Hammer size={26} />
        </div>

        <div>
          <h2>Ready to Build?</h2>
          <p>
            Run a safe project build/check first. After the build succeeds,
            DevSure will unlock the testing flow for user rules analysis.
          </p>
          <span>{folderPath}</span>
        </div>
      </div>

      {buildError && (
        <div className="build-error-box">
          <div className="build-error-title">
            <AlertTriangle size={17} />
            Build Failed
          </div>

          <p>{buildError.message || "Project build failed"}</p>

          {buildError.executedCommand && (
            <code>Command: {buildError.executedCommand}</code>
          )}

          {(buildError.errorOutput || buildError.output) && (
            <pre>{buildError.errorOutput || buildError.output}</pre>
          )}
        </div>
      )}

      <button
        type="button"
        className="build-proceed-button"
        disabled={building}
        onClick={onBuild}
      >
        {building ? (
          <>
            <Loader2 className="spin" size={18} />
            Building...
          </>
        ) : (
          <>
            <Rocket size={18} />
            Build Project
          </>
        )}
      </button>
    </section>
  );
}
