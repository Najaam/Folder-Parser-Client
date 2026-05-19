import { useState } from "react";
import {
  CheckCircle2,
  Terminal,
  Folder,
  ArrowLeft,
  Rocket,
  FileCheck2,
  Network,
  Route,
  Loader2,
  PlayCircle,
  ClipboardList,
  AlertTriangle,
  CheckCheck,
  FunctionSquare,
  ArrowRight
} from "lucide-react";
import { startTesting } from "../api/analyzerApi";

export default function BuildResultPage({ buildResult, onBack }) {
  const [userStory, setUserStory] = useState("");
  const [testing, setTesting] = useState(false);
  const [testingError, setTestingError] = useState(null);
  const [modulePrompt, setModulePrompt] = useState(null);
  const [moduleResult, setModuleResult] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  const currentModule = modulePrompt?.currentModule || moduleResult?.currentModule;
  const analyzedFunctions = moduleResult?.analyzedFunctions || [];
  const moduleFunctionNames = modulePrompt?.currentModule?.functionNames || [];
  const controllerPrefix =
    modulePrompt?.currentModule?.firstEndpoint?.controllerFunction?.split(".")[0] ||
    null;
  const moduleControllerFunctions = moduleFunctionNames.map((functionName) =>
    controllerPrefix ? `${controllerPrefix}.${functionName}` : functionName
  );
  const totalApis = currentModule?.totalApis || 0;
  const entryFile =
    modulePrompt?.entryFile ||
    moduleResult?.entryFile ||
    buildResult?.entryFile ||
    "src/server.js";

  const requestModulePrompt = async (nextModuleIndex = 0) => {
    try {
      setTesting(true);
      setTestingError(null);

      const result = await startTesting({
        folderPath: buildResult?.folderPath,
        entryFile: buildResult?.entryFile || "src/server.js",
        moduleIndex: nextModuleIndex
      });

      setUserStory("");
      setModulePrompt(result);
      setModuleResult(null);
      setIsStoryModalOpen(result.status === "USER_STORY_REQUIRED");
    } catch (err) {
      setTestingError(err);
    } finally {
      setTesting(false);
    }
  };

  const handleSubmitUserStory = async () => {
    if (!userStory.trim()) {
      setTestingError({
        message: "Please enter the user rules for this module first."
      });
      return;
    }

    try {
      setTesting(true);
      setTestingError(null);

      const result = await startTesting({
        folderPath: buildResult?.folderPath,
        entryFile: buildResult?.entryFile || "src/server.js",
        moduleIndex: modulePrompt?.moduleIndex || 0,
        userStory: userStory.trim()
      });

      setModuleResult(result);
      setCompletedModules((previousModules) => [
        ...previousModules.filter(
          (moduleItem) => moduleItem.moduleIndex !== result.moduleIndex
        ),
        result
      ]);
      setIsStoryModalOpen(false);
    } catch (err) {
      setTestingError(err);
    } finally {
      setTesting(false);
    }
  };

  const handleMoveToNextModule = () => {
    const nextModuleIndex =
      moduleResult?.nextModule?.moduleIndex ?? (moduleResult?.moduleIndex || 0) + 1;

    requestModulePrompt(nextModuleIndex);
  };

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

          <h1>Project is ready for module testing</h1>

          <p>
            Start testing will read mounted routes from the entry point one by
            one. Each module asks for its own user rules before showing only its
            controller functions.
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

      <section className="testing-start-card">
        <div className="testing-start-copy">
          <div className="testing-start-icon">
            <PlayCircle size={26} />
          </div>

          <div>
            <h2>Start Testing</h2>
            <p>
              The first app.use module will open in a popup. Add that module's
              user rules, analyze its route-end functions, then move to the next
              module.
            </p>
          </div>
        </div>

        {testingError && (
          <div className="build-error-box">
            <div className="build-error-title">
              <AlertTriangle size={17} />
              Testing Failed
            </div>
            <p>{testingError.message || "Unable to start testing flow"}</p>
          </div>
        )}

        <button
          type="button"
          className="build-proceed-button"
          disabled={testing}
          onClick={() => requestModulePrompt(0)}
        >
          {testing && !isStoryModalOpen ? (
            <>
              <Loader2 className="spin" size={18} />
              Finding First Module...
            </>
          ) : (
            <>
              <PlayCircle size={18} />
              Start Testing
            </>
          )}
        </button>
      </section>

      <section className="api-flow-panel">
        <div className="panel-header compact-panel-header">
          <h2>Testing Flow</h2>
          <p>
            {moduleResult?.message ||
              modulePrompt?.message ||
              "Click Start Testing to find the first mounted route module."}
          </p>
        </div>

        <div className="api-flow-summary">
          <div>
            <Network size={20} />
            <span>{totalApis} Module APIs</span>
          </div>

          <div>
            <Route size={20} />
            <span>{entryFile}</span>
          </div>
        </div>

        {currentModule && (
          <div className="module-status-card">
            <div>
              <span>Current Module</span>
              <h3>{currentModule.moduleName}</h3>
              <p>{currentModule.basePath}</p>
            </div>

            <strong>
              {(currentModule.moduleIndex || 0) + 1} /{" "}
              {modulePrompt?.totalModules || moduleResult?.totalModules}
            </strong>
          </div>
        )}

        {analyzedFunctions.length > 0 && (
          <div className="analyzed-functions-panel">
            <div className="analyzed-functions-title">
              <CheckCheck size={20} />
              <h3>{currentModule?.moduleName} Functions</h3>
            </div>

            <div className="analyzed-functions-list">
              {analyzedFunctions.map((item) => (
                <article className="analyzed-function-card" key={item.id}>
                  <div className="analyzed-function-main">
                    <div>
                      <strong>{item.functionName}</strong>
                      <p>{item.message || "Function analyzed successfully"}</p>
                    </div>
                    <span>{item.status}</span>
                  </div>
                </article>
              ))}
            </div>

            {moduleResult?.hasNextModule && (
              <button
                type="button"
                className="next-module-button"
                disabled={testing}
                onClick={handleMoveToNextModule}
              >
                <ArrowRight size={18} />
                Move to Next Module
              </button>
            )}
          </div>
        )}

        {completedModules.length > 0 && (
          <div className="completed-modules-strip">
            {completedModules.map((completedModule) => (
              <span key={completedModule.moduleIndex}>
                {completedModule.currentModule?.moduleName} analyzed
              </span>
            ))}
          </div>
        )}

        {!currentModule && (
          <div className="api-flow-empty testing-empty-state">
            <ClipboardList size={22} />
            Start testing to discover the first app.use module.
          </div>
        )}
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

      {isStoryModalOpen && modulePrompt?.currentModule && (
        <div className="module-story-modal-backdrop">
          <section className="module-story-modal">
            <div className="module-story-modal-icon">
              <FunctionSquare size={24} />
            </div>

            <span className="success-badge">Module Found</span>
            <h2>{modulePrompt.currentModule.moduleName} Module</h2>

            {moduleControllerFunctions.length > 0 && (
              <div className="first-endpoint-card">
                <span>Controller Functions Found</span>
                <div className="module-function-list">
                  {moduleControllerFunctions.map((functionName) => (
                    <strong key={functionName}>{functionName}</strong>
                  ))}
                </div>
              </div>
            )}

            <label className="user-story-field">
              <span>{modulePrompt.currentModule.moduleName} User Rules</span>
              <textarea
                value={userStory}
                onChange={(event) => setUserStory(event.target.value)}
                placeholder={`Add ${modulePrompt.currentModule.moduleName.toLowerCase()} module rules here...`}
                rows={5}
              />
            </label>

            <button
              type="button"
              className="build-proceed-button"
              disabled={testing}
              onClick={handleSubmitUserStory}
            >
              {testing ? (
                <>
                  <Loader2 className="spin" size={18} />
                  Analyzing Module...
                </>
              ) : (
                <>
                  <CheckCheck size={18} />
                  Analyze {modulePrompt.currentModule.moduleName}
                </>
              )}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
