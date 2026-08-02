import {
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  FunctionSquare,
  Download,
  Upload,
  Boxes,
  Route,
  GitBranch,
  CircleDot,
  Check,
  X,
  Package,
  Play,
  TestTube2,
  Server,
  Layers,
  Code2,
  Terminal,
  Box,
  Settings
} from "lucide-react";
import "./FileDetails.css";

export default function FileDetails({ file }) {
  if (!file) {
    return (
      <div className="details-card empty-details">
        <FileCode2 size={34} />
        <h3>Select a file</h3>
        <p>Click any file from the tree to view its detailed static analysis.</p>
      </div>
    );
  }

  const parseResult = file.parseResult;
  const summary = parseResult?.summary;

  return (
    <div className="details-card">
      <div className="details-header">
        <div>
          <h2>{file.name}</h2>
          <p>{file.path}</p>
        </div>

        {parseResult?.parseSuccess ? (
          <span className="status-pill success">
            <CheckCircle2 size={15} />
            Parsed
          </span>
        ) : (
          <span className="status-pill failed">
            <AlertTriangle size={15} />
            Not Parsed
          </span>
        )}
      </div>

      {!parseResult?.parseSuccess && (
        <div className="error-box">
          <strong>Reason:</strong>{" "}
          {parseResult?.reason || parseResult?.error || "Unknown error"}
        </div>
      )}

      {parseResult?.parseSuccess && parseResult?.fileType === "package-json" && (
        <PackageJsonDetails summary={summary} />
      )}

      {parseResult?.parseSuccess &&
        parseResult?.fileType !== "package-json" &&
        summary && (
          <>
            <div className="summary-grid">
              <SmallSummary
                icon={Download}
                title="Import Modules"
                value={summary.imports?.totalImportedModules || 0}
              />

              <SmallSummary
                icon={CircleDot}
                title="Import Items"
                value={summary.imports?.totalImportedItems || 0}
              />

              <SmallSummary
                icon={Check}
                title="Used Imports"
                value={summary.imports?.usedImportedItems || 0}
              />

              <SmallSummary
                icon={X}
                title="Unused Imports"
                value={summary.imports?.unusedImportedItems || 0}
              />

              <SmallSummary
                icon={Upload}
                title="Exports"
                value={summary.exports?.totalExports || 0}
              />

              <SmallSummary
                icon={FunctionSquare}
                title="Functions"
                value={summary.functions?.totalFunctions || 0}
              />

              <SmallSummary
                icon={Boxes}
                title="Classes"
                value={summary.classes?.totalClasses || 0}
              />

              <SmallSummary
                icon={Route}
                title="API Routes"
                value={summary.apiRoutes?.totalRoutes || 0}
              />
            </div>

            <DetailSection title="Imported Modules">
              <ImportModules modules={summary.imports?.modules || []} />
            </DetailSection>

            <DetailSection title="Exports">
              <ExportsDetails exportsData={summary.exports} />
            </DetailSection>

            <DetailSection title="Functions & Dependencies">
              <FunctionsDetails functionsData={summary.functions} />
            </DetailSection>

            <DetailSection title="Function Dependency Map">
              <FunctionDependencyMap
                dependencies={summary.functions?.dependencies || []}
              />
            </DetailSection>

            <DetailSection title="Function Call Graph">
              <CallGraph callGraph={summary.functions?.callGraph || {}} />
            </DetailSection>

            <DetailSection title="API Routes">
              <ApiRoutes routes={summary.apiRoutes?.routes || []} />
            </DetailSection>

            <DetailSection title="Classes">
              <ClassesDetails classes={summary.classes?.list || []} />
            </DetailSection>

            <DetailSection title="Variables">
              <VariablesDetails variables={summary.variables?.list || []} />
            </DetailSection>
          </>
        )}
    </div>
  );
}

function PackageJsonDetails({ summary }) {
  if (!summary) {
    return <p className="muted-text">No package.json summary available.</p>;
  }

  const projectInfo = summary.projectInfo || {};
  const entryPoints = summary.entryPoints || {};
  const scripts = summary.scripts || {};
  const dependencies = summary.dependencies || {};
  const detectedStack = summary.detectedStack || {};
  const devSureHints = summary.devSureHints || {};

  return (
    <>
      <div className="summary-grid">
        <SmallSummary
          icon={Package}
          title="Project"
          value={projectInfo.name || "N/A"}
        />

        <SmallSummary
          icon={Code2}
          title="Module System"
          value={devSureHints.moduleSystem || projectInfo.projectType || "N/A"}
        />

        <SmallSummary
          icon={Server}
          title="Runtime"
          value={detectedStack.runtime || "unknown"}
        />

        <SmallSummary
          icon={Play}
          title="Scripts"
          value={scripts.totalScripts || 0}
        />

        <SmallSummary
          icon={Download}
          title="Dependencies"
          value={dependencies.totalDependencies || 0}
        />

        <SmallSummary
          icon={Settings}
          title="Dev Dependencies"
          value={dependencies.totalDevDependencies || 0}
        />

        <SmallSummary
          icon={Layers}
          title="Frameworks"
          value={detectedStack.frameworks?.length || 0}
        />

        <SmallSummary
          icon={TestTube2}
          title="Test Tools"
          value={detectedStack.testTools?.length || 0}
        />
      </div>

      <DetailSection title="Project Information">
        <div className="analysis-block">
          <InfoRow label="Name" value={projectInfo.name || "N/A"} />
          <InfoRow label="Version" value={projectInfo.version || "N/A"} />
          <InfoRow
            label="Description"
            value={projectInfo.description || "No description"}
          />
          <InfoRow
            label="Project Type"
            value={projectInfo.projectType || "commonjs"}
          />
          <InfoRow label="Private" value={projectInfo.private ? "Yes" : "No"} />
          <InfoRow label="License" value={projectInfo.license || "N/A"} />
        </div>
      </DetailSection>

      <DetailSection title="Entry Points">
        <div className="analysis-block">
          <InfoRow
            label="Primary Entry"
            value={entryPoints.primaryEntry || "index.js"}
          />
          <InfoRow label="Main" value={entryPoints.main || "N/A"} />
          <InfoRow label="Module" value={entryPoints.module || "N/A"} />
          <InfoRow label="Browser" value={entryPoints.browser || "N/A"} />

          <div className="dependency-line">
            <div className="dependency-line-label">Possible Entries</div>
            <div className="dependency-line-items">
              {entryPoints.possibleEntries?.length ? (
                entryPoints.possibleEntries.map((entry, index) => (
                  <span className="dependency-chip internal" key={index}>
                    {entry}
                  </span>
                ))
              ) : (
                <span className="dependency-empty">None</span>
              )}
            </div>
          </div>
        </div>
      </DetailSection>

      <DetailSection title="DevSure Hints">
        <div className="analysis-block">
          <InfoRow
            label="Probable Entry File"
            value={devSureHints.probableEntryFile || "N/A"}
          />
          <InfoRow
            label="Probable Start Command"
            value={devSureHints.probableStartCommand || "N/A"}
          />
          <InfoRow
            label="Probable Test Command"
            value={devSureHints.probableTestCommand || "N/A"}
          />
          <InfoRow
            label="Should Look For Server File"
            value={devSureHints.shouldLookForServerFile ? "Yes" : "No"}
          />
          <InfoRow
            label="Should Look For Routes"
            value={devSureHints.shouldLookForRoutes ? "Yes" : "No"}
          />
        </div>
      </DetailSection>

      <DetailSection title="Scripts">
        <ScriptsDetails scripts={scripts.availableScripts || {}} />
      </DetailSection>

      <DetailSection title="Detected Frameworks">
        <DetectedItems items={detectedStack.frameworks || []} emptyText="No frameworks detected." />
      </DetailSection>

      <DetailSection title="Detected Test Tools">
        <DetectedItems items={detectedStack.testTools || []} emptyText="No test tools detected." />
      </DetailSection>

      <DetailSection title="Dependencies">
        <DependencyList
          title="Production Dependencies"
          dependencies={dependencies.dependencies || {}}
        />
      </DetailSection>

      <DetailSection title="Dev Dependencies">
        <DependencyList
          title="Development Dependencies"
          dependencies={dependencies.devDependencies || {}}
        />
      </DetailSection>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{String(value)}</span>
    </div>
  );
}

function ScriptsDetails({ scripts }) {
  const entries = Object.entries(scripts);

  if (!entries.length) {
    return <p className="muted-text">No scripts found.</p>;
  }

  return (
    <div className="detail-list">
      {entries.map(([name, command]) => (
        <div className="script-row" key={name}>
          <span className="script-name">
            <Terminal size={14} />
            {name}
          </span>
          <code>{command}</code>
        </div>
      ))}
    </div>
  );
}

function DetectedItems({ items, emptyText }) {
  if (!items.length) {
    return <p className="muted-text">{emptyText}</p>;
  }

  return (
    <div className="detail-list">
      {items.map((item, index) => (
        <div className="code-row" key={`${item.name}-${index}`}>
          <span className="code-name">
            <Box size={14} />
            {item.name}
          </span>
          <span className="code-muted">
            {item.package} {item.version ? `(${item.version})` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function DependencyList({ title, dependencies }) {
  const entries = Object.entries(dependencies);

  if (!entries.length) {
    return <p className="muted-text">No {title.toLowerCase()} found.</p>;
  }

  return (
    <div className="analysis-block">
      <div className="analysis-block-header">
        <div>
          <h4>{title}</h4>
          <p>Total: {entries.length}</p>
        </div>
        <span className="mini-pill">{entries.length} packages</span>
      </div>

      <div className="package-grid">
        {entries.map(([name, version]) => (
          <div className="package-pill" key={name}>
            <span>{name}</span>
            <small>{version}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmallSummary({ icon: Icon, title, value }) {
  return (
    <div className="small-summary">
      <Icon size={18} />
      <div>
        <p>{title}</p>
        <h4>{value}</h4>
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div className="detail-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function ImportModules({ modules }) {
  if (!modules.length) {
    return <p className="muted-text">No imports found.</p>;
  }

  return (
    <div className="detail-list">
      {modules.map((moduleItem, index) => (
        <div className="analysis-block" key={`${moduleItem.source}-${index}`}>
          <div className="analysis-block-header">
            <div>
              <h4>{moduleItem.source}</h4>
              <p>
                Total items: {moduleItem.totalImportedItems} | Used:{" "}
                {moduleItem.usedItems?.length || 0} | Unused:{" "}
                {moduleItem.unusedItems?.length || 0}
              </p>
            </div>

            <span className="mini-pill">{moduleItem.importType}</span>
          </div>

          <div className="table-like">
            {moduleItem.importedItems?.map((item, itemIndex) => (
              <div className="table-row" key={`${item.localName}-${itemIndex}`}>
                <span className="code-name">{item.localName}</span>
                <span className="code-muted">{item.importKind}</span>
                <span className="code-muted">
                  imported as: {item.importedName}
                </span>
                <span
                  className={
                    item.used ? "usage-badge used" : "usage-badge unused"
                  }
                >
                  {item.used ? "Used" : "Unused"} ({item.usageCount})
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExportsDetails({ exportsData }) {
  if (!exportsData || exportsData.totalExports === 0) {
    return <p className="muted-text">No exports found.</p>;
  }

  return (
    <div className="detail-list">
      {exportsData.namedExports?.length > 0 && (
        <div className="analysis-block">
          <h4>Named Exports</h4>

          {exportsData.namedExports.map((item, index) => (
            <div className="code-row" key={index}>
              <span className="code-name">
                {item.name || item.exportedName || "unknown"}
              </span>
              <span className="code-muted">{item.type}</span>
            </div>
          ))}
        </div>
      )}

      {exportsData.defaultExports?.length > 0 && (
        <div className="analysis-block">
          <h4>Default Exports</h4>

          {exportsData.defaultExports.map((item, index) => (
            <div className="code-row" key={index}>
              <span className="code-name">{item.name || "anonymous"}</span>
              <span className="code-muted">{item.type}</span>
            </div>
          ))}
        </div>
      )}

      {exportsData.commonJsExports?.length > 0 && (
        <div className="analysis-block">
          <h4>CommonJS Exports</h4>

          {exportsData.commonJsExports.map((item, index) => (
            <div className="code-row" key={index}>
              <span className="code-name">{item.exportName || "unknown"}</span>
              <span className="code-muted">
                {item.value || item.rightNodeType || "unknown"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FunctionsDetails({ functionsData }) {
  const functions = functionsData?.list || [];

  if (!functions.length) {
    return <p className="muted-text">No functions found.</p>;
  }

  return (
    <div className="detail-list">
      {functions.map((func, index) => (
        <div className="analysis-block" key={`${func.name}-${index}`}>
          <div className="analysis-block-header">
            <div>
              <h4>{func.name}</h4>
              <p>
                Type: {func.type} | Params:{" "}
                {func.params?.length ? func.params.join(", ") : "No params"}
              </p>
            </div>

            <span className="mini-pill">
              Lines {func.startLine || "?"} - {func.endLine || "?"}
            </span>
          </div>

          <DependencyGroup
            title="Internal Dependencies"
            items={func.internalCalls || []}
          />

          <DependencyGroup
            title="External Calls"
            items={func.externalCalls || []}
          />

          <DependencyGroup
            title="Imported Function Calls"
            items={func.importedCalls || []}
          />

          <DependencyGroup title="Called By" items={func.calledBy || []} />
        </div>
      ))}
    </div>
  );
}

function FunctionDependencyMap({ dependencies }) {
  if (!dependencies.length) {
    return <p className="muted-text">No function dependencies found.</p>;
  }

  return (
    <div className="dependency-map">
      {dependencies.map((dependency, index) => (
        <div
          className="dependency-card"
          key={`${dependency.functionName}-${index}`}
        >
          <div className="dependency-card-header">
            <span className="function-dot"></span>

            <div>
              <h4>{dependency.functionName}</h4>
              <p>Dependency overview for this function</p>
            </div>
          </div>

          <DependencyLine
            label="Internal Functions"
            items={dependency.dependsOnInternalFunctions || []}
            type="internal"
          />

          <DependencyLine
            label="Imported Functions"
            items={dependency.dependsOnImportedFunctions || []}
            type="imported"
          />

          <DependencyLine
            label="External Calls"
            items={dependency.dependsOnExternalFunctions || []}
            type="external"
          />

          <DependencyLine
            label="Called By"
            items={dependency.calledBy || []}
            type="calledBy"
          />
        </div>
      ))}
    </div>
  );
}

function DependencyLine({ label, items, type }) {
  return (
    <div className="dependency-line">
      <div className="dependency-line-label">{label}</div>

      <div className="dependency-line-items">
        {items.length ? (
          items.map((item, index) => (
            <span className={`dependency-chip ${type}`} key={`${item}-${index}`}>
              {item}
            </span>
          ))
        ) : (
          <span className="dependency-empty">None</span>
        )}
      </div>
    </div>
  );
}

function DependencyGroup({ title, items }) {
  return (
    <div className="dependency-group">
      <span className="dependency-title">{title}</span>

      {items.length ? (
        <div className="chips">
          {items.map((item, index) => (
            <span className="chip" key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span className="no-chip">None</span>
      )}
    </div>
  );
}

function CallGraph({ callGraph }) {
  const entries = Object.entries(callGraph);

  if (!entries.length) {
    return <p className="muted-text">No call graph available.</p>;
  }

  return (
    <div className="detail-list">
      {entries.map(([functionName, graph]) => (
        <div className="call-graph-row" key={functionName}>
          <div className="call-graph-title">
            <GitBranch size={16} />
            <span>{functionName}</span>
          </div>

          <DependencyGroup title="Calls" items={graph.calls || []} />
          <DependencyGroup title="Called By" items={graph.calledBy || []} />
        </div>
      ))}
    </div>
  );
}

function ApiRoutes({ routes }) {
  if (!routes.length) {
    return <p className="muted-text">No Express-style API routes found.</p>;
  }

  return (
    <div className="detail-list">
      {routes.map((route, index) => (
        <div className="route-row" key={index}>
          <span className="method-badge">{route.method}</span>

          <div>
            <h4>{route.path}</h4>
            <p>
              Router: {route.routerObject || "unknown"} | Handlers:{" "}
              {route.handlers?.filter(Boolean).join(", ") || "none"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassesDetails({ classes }) {
  if (!classes.length) {
    return <p className="muted-text">No classes found.</p>;
  }

  return (
    <div className="detail-list">
      {classes.map((classItem, index) => (
        <div className="analysis-block" key={`${classItem.name}-${index}`}>
          <div className="analysis-block-header">
            <div>
              <h4>{classItem.name}</h4>
              <p>
                Lines {classItem.startLine || "?"} -{" "}
                {classItem.endLine || "?"}
              </p>
            </div>

            <span className="mini-pill">
              {classItem.methods?.length || 0} methods
            </span>
          </div>

          {classItem.methods?.length ? (
            classItem.methods.map((method, methodIndex) => (
              <div className="code-row" key={methodIndex}>
                <span className="code-name">{method.name}</span>
                <span className="code-muted">
                  {method.kind} ({method.params?.join(", ") || "no params"})
                </span>
              </div>
            ))
          ) : (
            <p className="muted-text">No methods found.</p>
          )}
        </div>
      ))}
    </div>
  );
}

function VariablesDetails({ variables }) {
  if (!variables.length) {
    return <p className="muted-text">No variables found.</p>;
  }

  return (
    <div className="detail-list">
      {variables.map((variable, index) => (
        <div className="code-row" key={`${variable.name}-${index}`}>
          <span className="code-name">{variable.name}</span>
          <span className="code-muted">
            {variable.kind} | Lines {variable.startLine || "?"} -{" "}
            {variable.endLine || "?"}
          </span>
        </div>
      ))}
    </div>
  );
}