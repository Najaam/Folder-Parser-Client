import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Code2,
  FileDown,
  Folder,
  FolderOpen,
  FolderTree as FolderTreeIcon,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import Header from "../components/Header";
import AnalyzerForm from "../components/AnalyzerForm";
import StatsCards from "../components/StatsCards";
import FolderTree from "../components/FolderTree";
import FileDetails from "../components/FileDetails";
import EmptyState from "../components/EmptyState";
import BuildActionCard from "../components/BuildActionCard";
import BuildResultPage from "./BuildResultPage";
import { analyzeLocalFolder, buildLocalFolder } from "../api/analyzerApi";
import { calculateTreeStats } from "../utils/treeStats";
import "./FolderParser.css";

export default function FolderParser() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);

  const [error, setError] = useState("");
  const [buildError, setBuildError] = useState(null);
  const [buildResult, setBuildResult] = useState(null);

  const [screen, setScreen] = useState("analysis");
  const [copiedPath, setCopiedPath] = useState(false);
  const [exportStatus, setExportStatus] = useState("idle");
  const [exportError, setExportError] = useState("");

  const stats = useMemo(() => {
    if (!analysisResult?.result) return null;
    return calculateTreeStats(analysisResult.result);
  }, [analysisResult]);

  const handleAnalyze = async (folderPath) => {
    try {
      setLoading(true);
      setError("");
      setBuildError(null);
      setBuildResult(null);
      setSelectedFile(null);
      setScreen("analysis");

      const data = await analyzeLocalFolder(folderPath);
      setAnalysisResult(data);
    } catch (err) {
      setAnalysisResult(null);
      setError(err.message || "Something went wrong while analyzing folder");
    } finally {
      setLoading(false);
    }
  };

  const handleBuildAndProceed = async () => {
    try {
      setBuilding(true);
      setBuildError(null);

      const folderPath = analysisResult?.folderPath;

      if (!folderPath) {
        setBuildError({
          message: "Folder path not found. Please analyze folder again."
        });
        return;
      }

      const result = await buildLocalFolder({ folderPath });

      setBuildResult({ ...result, analysisStats: stats });
      setScreen("build-result");
    } catch (err) {
      setBuildError(err);
    } finally {
      setBuilding(false);
    }
  };

  const copyFolderPath = async () => {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(analysisResult?.folderPath || "");
      setCopiedPath(true);
      window.setTimeout(() => setCopiedPath(false), 1600);
    } catch {
      // Clipboard access is optional and must not affect the analyzer workflow.
    }
  };

  const handleExportReport = () => {
    if (!analysisResult || !stats) return;
    try {
      setExportStatus("exporting");
      setExportError("");
      const report = {
        generatedAt: new Date().toISOString(),
        project: {
          name: analysisResult.result?.name || "Analyzed Project",
          path: analysisResult.folderPath,
          analysisStatus: "completed"
        },
        metrics: {
          folders: stats.totalFolders,
          files: stats.totalFiles,
          parsedFiles: stats.parsedFiles,
          unsupportedFiles: stats.unsupportedFiles,
          functions: stats.totalFunctions,
          imports: stats.totalImports,
          exports: stats.totalExports,
          apiRoutes: stats.totalApiRoutes,
          classes: stats.totalClasses
        },
        projectTree: analysisResult.result
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${String(report.project.name).replace(/[^a-z0-9-_]/gi, "-") || "devsure"}-analysis-report.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportStatus("exported");
      window.setTimeout(() => setExportStatus("idle"), 1800);
    } catch (err) {
      setExportStatus("idle");
      setExportError(err?.message || "Could not export the analysis report.");
    }
  };

  if (screen === "build-result") {
    return (
      <BuildResultPage
        buildResult={buildResult}
        onBack={() => setScreen("analysis")}
      />
    );
  }

  return (
    <main className="app-shell">
      {!analysisResult && <>
        <Header />
        <AnalyzerForm onAnalyze={handleAnalyze} loading={loading} />
      </>}

      {error && <div className="global-error">{error}</div>}

      {!analysisResult && <section className="capability-strip" aria-label="Analyzer capabilities">
        <article>
          <span className="capability-icon"><FolderTreeIcon size={22} /></span>
          <div><h2>Deep Structure Inspection</h2><p>Explore your project folders and files in detail.</p></div>
        </article>
        <article>
          <span className="capability-icon"><Code2 size={22} /></span>
          <div><h2>Code Summarization</h2><p>Extract intelligent summaries for your source files.</p></div>
        </article>
        <article>
          <span className="capability-icon secure"><ShieldCheck size={22} /></span>
          <div><h2>Private by Design</h2><p>Your analysis stays within your local environment.</p></div>
        </article>
      </section>}

      {!analysisResult && !loading && <EmptyState />}

      {analysisResult && stats && (
        <>
          <header className="workspace-topbar">
            <div className="workspace-brand"><Code2 size={20} /> <strong>DevSure Analyzer</strong></div>
            <div className="workspace-topbar-actions">
              <button
                type="button"
                className="workspace-action"
                onClick={() => {
                  setAnalysisResult(null);
                  setSelectedFile(null);
                  setBuildResult(null);
                  setBuildError(null);
                  setError("");
                }}
                title="Select a different folder"
              >
                <FolderOpen size={16} /> Change Folder
              </button>
              <button
                type="button"
                className="workspace-action"
                disabled={loading}
                onClick={() => handleAnalyze(analysisResult.folderPath)}
              >
                <RefreshCw className={loading ? "spin" : ""} size={16} /> Re-analyze
              </button>
              <button
                type="button"
                className="workspace-action export-action"
                disabled={exportStatus === "exporting"}
                onClick={handleExportReport}
              >
                <FileDown size={16} /> {exportStatus === "exporting" ? "Exporting..." : exportStatus === "exported" ? "✓ Exported" : "Export Report"}
              </button>
            </div>
          </header>

          {exportError && <div className="global-error export-error">{exportError}</div>}

          <section className="project-summary-card analyzer-enter summary-enter">
            <span className="project-summary-icon"><Folder size={30} /></span>
            <div className="project-summary-copy">
              <h1>{analysisResult.result?.name || "Analyzed Project"}</h1>
              <div className="project-path-row"><p>{analysisResult.folderPath}</p><button type="button" onClick={copyFolderPath} aria-label="Copy project path" title="Copy project path"><Clipboard size={15} /></button></div>
              <small>Analysis completed just now</small>
            </div>
            <span className="analysis-complete-badge"><CheckCircle2 size={16} /> {copiedPath ? "Path copied" : "Analysis Completed"}</span>
          </section>

          <StatsCards stats={stats} />

          <section className="workspace analyzer-enter workspace-enter">
            <div className="panel tree-panel">
              <div className="panel-header">
                <h2>Project Explorer</h2>
                <p>Browse analyzed files and folders</p>
              </div>

              <FolderTree
                node={analysisResult.result}
                onSelectFile={setSelectedFile}
                selectedPath={selectedFile?.path}
                onRefresh={() => handleAnalyze(analysisResult.folderPath)}
                refreshing={loading}
              />
              <div className="tree-analysis-summary"><span className="summary-parsed"><CheckCircle2 size={15} /> {stats.parsedFiles} files parsed successfully</span><span className="summary-unsupported"><AlertTriangle size={15} /> {stats.unsupportedFiles} unsupported files</span></div>
            </div>

            <div className="panel details-panel">
              <FileDetails file={selectedFile} />
            </div>
          </section>

          <div className="analyzer-enter build-enter"><BuildActionCard
            folderPath={analysisResult.folderPath}
            onBuild={handleBuildAndProceed}
            building={building}
            buildError={buildError}
          /></div>
        </>
      )}
    </main>
  );
}
