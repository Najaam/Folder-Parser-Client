import { useMemo, useState } from "react";
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

export default function FolderParser() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);

  const [error, setError] = useState("");
  const [buildError, setBuildError] = useState(null);
  const [buildResult, setBuildResult] = useState(null);

  const [screen, setScreen] = useState("analysis");

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

      setBuildResult(result);
      setScreen("build-result");
    } catch (err) {
      setBuildError(err);
    } finally {
      setBuilding(false);
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
      <Header />

      <AnalyzerForm onAnalyze={handleAnalyze} loading={loading} />

      {error && <div className="global-error">{error}</div>}

      {!analysisResult && !loading && <EmptyState />}

      {analysisResult && stats && (
        <>
          <StatsCards stats={stats} />

          <section className="workspace">
            <div className="panel tree-panel">
              <div className="panel-header">
                <h2>Folder Tree</h2>
                <p>{analysisResult.folderPath}</p>
              </div>

              <FolderTree
                node={analysisResult.result}
                onSelectFile={setSelectedFile}
                selectedPath={selectedFile?.path}
              />
            </div>

            <div className="panel details-panel">
              <FileDetails file={selectedFile} />
            </div>
          </section>

          <BuildActionCard
            folderPath={analysisResult.folderPath}
            onBuild={handleBuildAndProceed}
            building={building}
            buildError={buildError}
          />
        </>
      )}
    </main>
  );
}
