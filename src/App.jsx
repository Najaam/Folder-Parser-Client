import { useMemo, useState } from "react";
import Header from "./components/Header";
import AnalyzerForm from "./components/AnalyzerForm";
import StatsCards from "./components/StatsCards";
import FolderTree from "./components/FolderTree";
import FileDetails from "./components/FileDetails";
import EmptyState from "./components/EmptyState";
import { analyzeLocalFolder } from "./api/analyzerApi";
import { calculateTreeStats } from "./utils/treeStats";

export default function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    if (!analysisResult?.result) return null;
    return calculateTreeStats(analysisResult.result);
  }, [analysisResult]);

  const handleAnalyze = async (folderPath) => {
    try {
      setLoading(true);
      setError("");
      setSelectedFile(null);

      const data = await analyzeLocalFolder(folderPath);
      setAnalysisResult(data);
    } catch (err) {
      setAnalysisResult(null);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
        </>
      )}
    </main>
  );
}