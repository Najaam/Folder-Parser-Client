import { useMemo, useState } from "react";
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
  ArrowRight,
  FileText,
  PencilLine,
  X
} from "lucide-react";
import "./BuildResultPage.css";

import {
  startTesting,
  generateModuleFeatureFile,
  generateFunctionTestCases,
  executeModuleTestCases
} from "../api/analyzerApi";

const CATEGORY_META = {
  success: "Success Test Cases",
  error: "Error / Validation Test Cases",
  failure: "Failure Test Cases",
  security: "Security Test Cases",
  edge: "Edge Case Test Cases",
  other: "Other Test Cases"
};

const CATEGORY_ORDER = ["success", "error", "failure", "security", "edge", "other"];
const ANSI_ESCAPE_PATTERN = new RegExp(
  `${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`,
  "g"
);

function getTestCategory(type = "") {
  const value = String(type).toLowerCase();

  if (value.includes("success") || value.includes("valid")) return "success";
  if (
    value.includes("error") ||
    value.includes("invalid") ||
    value.includes("validation")
  ) {
    return "error";
  }
  if (value.includes("fail")) return "failure";
  if (value.includes("security") || value.includes("auth")) return "security";
  if (value.includes("edge") || value.includes("boundary")) return "edge";

  return "other";
}

function groupTestCases(testCases = []) {
  const groups = testCases.reduce((result, testCase) => {
    const key = getTestCategory(testCase.scenarioType || testCase.type);
    result[key] = [...(result[key] || []), testCase];
    return result;
  }, {});

  return CATEGORY_ORDER
    .filter((key) => groups[key]?.length > 0)
    .map((key) => ({
      key,
      label: CATEGORY_META[key] || CATEGORY_META.other,
      items: groups[key]
    }));
}

function cleanTerminalOutput(text = "") {
  return text.replace(ANSI_ESCAPE_PATTERN, "").trim();
}


function getSafeNumber(value, fallback = null) {
  if (typeof value === "boolean") return fallback;

  const numberValue = Number(value);

  if (Number.isFinite(numberValue) && numberValue >= 0) {
    return numberValue;
  }

  return fallback;
}

function getResultTests(testExecutionResult = null) {
  if (!testExecutionResult) return [];

  const nestedResult = testExecutionResult.testResult || {};

  const topPassedTests = Array.isArray(testExecutionResult.passedTests)
    ? testExecutionResult.passedTests
    : [];

  const nestedPassedTests = Array.isArray(nestedResult.passedTests)
    ? nestedResult.passedTests
    : [];

  const topFailedTests = Array.isArray(testExecutionResult.failedTests)
    ? testExecutionResult.failedTests
    : [];

  const nestedFailedTests = Array.isArray(nestedResult.failedTests)
    ? nestedResult.failedTests
    : [];

  const passedTests = topPassedTests.length ? topPassedTests : nestedPassedTests;
  const failedTests = topFailedTests.length ? topFailedTests : nestedFailedTests;

  const detailedTests = Array.isArray(testExecutionResult.testDetails)
    ? testExecutionResult.testDetails
    : Array.isArray(nestedResult.testDetails)
    ? nestedResult.testDetails
    : [];

  const directTests = Array.isArray(testExecutionResult.testCases)
    ? testExecutionResult.testCases
    : [];

  const statusBasedTests = [
    ...failedTests.map((test) => ({
      ...test,
      status: test.status || "failed",
      passed: false,
      failed: true
    })),
    ...passedTests.map((test) => ({
      ...test,
      status: test.status || "passed",
      passed: true,
      failed: false
    }))
  ];

  const sourceTests = statusBasedTests.length
    ? statusBasedTests
    : detailedTests.length
    ? detailedTests
    : directTests;

  return sourceTests.map((test, index) => {
    const status = String(test.status || "").toLowerCase();

    const passed =
      test.passed === true ||
      status === "passed";

    const failed =
      test.failed === true ||
      status === "failed";

    const finalStatus = passed ? "passed" : failed ? "failed" : "unknown";

    const ancestorFunctionName = Array.isArray(test.ancestorTitles)
      ? test.ancestorTitles.find(Boolean)
      : "";

    return {
      id: test.id || `${test.functionName || ancestorFunctionName || "test"}-${index + 1}`,
      title: test.title || test.fullName || `Test Case ${index + 1}`,
      fullName: test.fullName || test.title || `Test Case ${index + 1}`,
      functionName:
        test.functionName ||
        test.moduleName ||
        ancestorFunctionName ||
        "Module",
      status: finalStatus,
      passed,
      failed,
      duration: Number(test.duration || test.durationMs || 0),
      failureReason: cleanReadableFailure(test.failureReason || test.error || ""),
      failureMessage: cleanReadableFailure(
        test.failureMessage ||
          (Array.isArray(test.failureMessages)
            ? test.failureMessages.join("\n\n")
            : "")
      )
    };
  });
}

function getExecutionStats(testExecutionResult = null) {
  const tests = getResultTests(testExecutionResult);

  const passedTests = tests.filter((test) => test.passed);
  const failedTests = tests.filter((test) => test.failed);

  const nestedResult = testExecutionResult?.testResult || {};

  const total =
    tests.length ||
    getSafeNumber(nestedResult.total) ||
    getSafeNumber(testExecutionResult?.total) ||
    0;

  const passed =
    tests.length > 0
      ? passedTests.length
      : getSafeNumber(nestedResult.passed) ||
        getSafeNumber(testExecutionResult?.passed) ||
        0;

  const failed =
    tests.length > 0
      ? failedTests.length
      : getSafeNumber(nestedResult.failed) ||
        getSafeNumber(testExecutionResult?.failed) ||
        0;

  const passPercentage = total > 0 ? Math.round((passed / total) * 100) : 0;

  return {
    tests,
    passedTests,
    failedTests,
    total,
    passed,
    failed,
    passPercentage
  };
}

function getFunctionWiseResults(testExecutionResult = null, tests = []) {
  const backendFunctionResults = Array.isArray(testExecutionResult?.functionResults)
    ? testExecutionResult.functionResults
    : [];

  const functionNames = [
    ...new Set([
      ...backendFunctionResults
        .map((item) => item.functionName)
        .filter(Boolean),
      ...tests
        .map((test) => test.functionName)
        .filter((name) => name && name !== "Module")
    ])
  ];

  if (!functionNames.length && backendFunctionResults.length > 0) {
    return backendFunctionResults.map((item) => ({
      functionName: item.functionName || "Function",
      passed: getSafeNumber(item.passed, 0),
      failed: getSafeNumber(item.failed, 0),
      total: getSafeNumber(item.total, 0)
    }));
  }

  return functionNames.map((functionName) => {
    const functionTests = tests.filter((test) => test.functionName === functionName);
    const backendItem =
      backendFunctionResults.find((item) => item.functionName === functionName) || {};

    const calculatedTotal = functionTests.length;
    const calculatedPassed = functionTests.filter((test) => test.passed).length;
    const calculatedFailed = functionTests.filter((test) => test.failed).length;

    return {
      functionName,
      passed:
        calculatedTotal > 0
          ? calculatedPassed
          : getSafeNumber(backendItem.passed, 0),
      failed:
        calculatedTotal > 0
          ? calculatedFailed
          : getSafeNumber(backendItem.failed, 0),
      total:
        calculatedTotal > 0
          ? calculatedTotal
          : getSafeNumber(backendItem.total, 0)
    };
  });
}


function mergeModuleReports(reports = [], nextReport) {
  const nextKey = String(nextReport.moduleIndex ?? nextReport.moduleName ?? Date.now());
  const filtered = (reports || []).filter((report) => {
    const reportKey = String(report.moduleIndex ?? report.moduleName ?? "");
    return reportKey !== nextKey;
  });

  return [...filtered, nextReport].sort((a, b) => {
    const aIndex = Number(a.moduleIndex ?? 0);
    const bIndex = Number(b.moduleIndex ?? 0);
    return aIndex - bIndex;
  });
}

function getModuleReportStats(report = {}) {
  const stats = getExecutionStats(report.executionResult);

  return {
    ...stats,
    moduleName: report.moduleName || "Module",
    moduleIndex: report.moduleIndex ?? 0,
    passPercentage: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0
  };
}

function getProjectQualityStats(reports = []) {
  const moduleStats = (reports || []).map(getModuleReportStats);
  const totalModules = moduleStats.length;
  const totalTests = moduleStats.reduce((sum, item) => sum + item.total, 0);
  const passed = moduleStats.reduce((sum, item) => sum + item.passed, 0);
  const failed = moduleStats.reduce((sum, item) => sum + item.failed, 0);
  const passPercentage = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;

  const allTests = (reports || []).flatMap((report) => {
    const tests = getResultTests(report.executionResult);

    return tests.map((test) => ({
      ...test,
      moduleName: report.moduleName || test.moduleName || "Module",
      moduleIndex: report.moduleIndex ?? 0,
      basePath: report.basePath || ""
    }));
  });

  const passedTests = allTests.filter((test) => test.passed);
  const failedTests = allTests.filter((test) => test.failed);

  return {
    moduleStats,
    totalModules,
    totalTests,
    passed,
    failed,
    passPercentage,
    allTests,
    passedTests,
    failedTests
  };
}

function getTopFailureReasons(failedTests = []) {
  const grouped = new Map();

  failedTests.forEach((test) => {
    const reason = getFailurePreview(test) || "No failure reason returned.";
    const key = reason.slice(0, 220);

    if (!grouped.has(key)) {
      grouped.set(key, {
        reason,
        count: 0,
        tests: []
      });
    }

    const item = grouped.get(key);
    item.count += 1;
    item.tests.push(test);
  });

  return [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 8);
}

function ProjectQualityDashboard({ reports = [], buildResult = {}, onBackToAnalysis }) {
  const {
    moduleStats,
    totalModules,
    totalTests,
    passed,
    failed,
    passPercentage,
    passedTests,
    failedTests
  } = getProjectQualityStats(reports);

  const topFailureReasons = getTopFailureReasons(failedTests);
  const isProjectPassing = totalTests > 0 && failed === 0;

  return (
    <section className="quality-dashboard-page">
      <div className={`quality-dashboard-hero ${isProjectPassing ? "passed" : "failed"}`}>
        <div className="quality-dashboard-orb">
          {isProjectPassing ? <CheckCircle2 size={40} /> : <AlertTriangle size={40} />}
        </div>

        <div>
          <span className={`execution-status-chip ${isProjectPassing ? "passed" : "failed"}`}>
            {isProjectPassing ? "Project ready" : "Review required"}
          </span>
          <h1>Project Quality Report</h1>
          <p>
            Combined dashboard for all completed modules. Review pass rate, failed test cases,
            module health, and exact failure reasons before final submission.
          </p>
        </div>
      </div>

      <div className="quality-summary-grid">
        <div className="quality-summary-card">
          <span>Modules Completed</span>
          <strong>{totalModules}</strong>
          <small>{buildResult?.folderPath || "Analyzed project modules"}</small>
        </div>

        <div className="quality-summary-card">
          <span>Total Tests</span>
          <strong>{totalTests}</strong>
          <small>Generated Jest test cases executed</small>
        </div>

        <div className="quality-summary-card passed">
          <span>Passed</span>
          <strong>{passed}</strong>
          <small>Working as expected</small>
        </div>

        <div className="quality-summary-card failed">
          <span>Failed</span>
          <strong>{failed}</strong>
          <small>Need review with reason</small>
        </div>

        <div className="quality-summary-card percentage">
          <span>Project Pass Rate</span>
          <strong>{passPercentage}%</strong>
          <small>Overall sandbox score</small>
        </div>
      </div>

      {moduleStats.length > 0 ? (
        <div className="quality-section">
          <div className="quality-section-header">
            <div>
              <span>Module health</span>
              <h2>Module-wise execution summary</h2>
            </div>
          </div>

          <div className="quality-module-grid">
            {moduleStats.map((module) => (
              <article className="quality-module-card" key={`${module.moduleName}-${module.moduleIndex}`}>
                <div className="quality-module-header">
                  <div>
                    <span>Module {Number(module.moduleIndex || 0) + 1}</span>
                    <h3>{module.moduleName}</h3>
                  </div>
                  <strong className={module.failed === 0 ? "passed" : "failed"}>
                    {module.passPercentage}%
                  </strong>
                </div>

                <div className="quality-progress-bar">
                  <span style={{ width: `${module.passPercentage}%` }} />
                </div>

                <div className="quality-module-stats">
                  <p><b>{module.total}</b> total</p>
                  <p><b>{module.passed}</b> passed</p>
                  <p><b>{module.failed}</b> failed</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="quality-empty-state">
          <ClipboardList size={28} />
          <h2>No module execution results yet</h2>
          <p>Execute tests for each module first. The dashboard will unlock after final module testing.</p>
        </div>
      )}

      {topFailureReasons.length > 0 && (
        <div className="quality-section">
          <div className="quality-section-header">
            <div>
              <span>Why tests failed</span>
              <h2>Top failure reasons</h2>
            </div>
          </div>

          <div className="failure-reason-summary-list">
            {topFailureReasons.map((item, index) => (
              <article className="failure-reason-summary-card" key={`${item.reason}-${index}`}>
                <div>
                  <span>{item.count} failed test{item.count > 1 ? "s" : ""}</span>
                  <pre>{item.reason}</pre>
                </div>
                <small>
                  {item.tests.slice(0, 3).map((test) => `${test.moduleName} / ${test.functionName}`).join(" • ")}
                </small>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="quality-test-details-grid">
        <section className="test-result-column failed quality-test-column">
          <div className="test-result-column-header">
            <h4>All Failed Test Cases</h4>
            <span>{failedTests.length}</span>
          </div>

          {failedTests.length === 0 ? (
            <p className="test-result-empty-text">No failed test cases across completed modules.</p>
          ) : (
            <div className="test-result-list">
              {failedTests.map((test, index) => (
                <article className="test-result-card failed" key={test.id || index}>
                  <div className="test-result-card-header">
                    <span className="test-result-badge failed">FAIL</span>
                    <div>
                      <h5>{test.title}</h5>
                      <p>{test.moduleName} / {test.functionName}</p>
                    </div>
                  </div>

                  <div className="failure-reason-box">
                    <span>Failure Reason</span>
                    <pre>{getFailurePreview(test)}</pre>
                  </div>

                  {test.failureMessage && (
                    <details className="failure-details-dropdown">
                      <summary>View full error</summary>
                      <pre>{test.failureMessage}</pre>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="test-result-column passed quality-test-column">
          <div className="test-result-column-header">
            <h4>All Passed Test Cases</h4>
            <span>{passedTests.length}</span>
          </div>

          {passedTests.length === 0 ? (
            <p className="test-result-empty-text">No passed test cases across completed modules.</p>
          ) : (
            <div className="test-result-list">
              {passedTests.map((test, index) => (
                <article className="test-result-card passed" key={test.id || index}>
                  <div className="test-result-card-header">
                    <span className="test-result-badge passed">PASS</span>
                    <div>
                      <h5>{test.title}</h5>
                      <p>{test.moduleName} / {test.functionName}</p>
                    </div>
                  </div>
                  <p className="passed-message">This test passed in the module sandbox.</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="quality-dashboard-actions">
        <button type="button" className="build-proceed-button" onClick={onBackToAnalysis}>
          <ArrowLeft size={17} />
          Back to Analysis Home
        </button>
      </div>
    </section>
  );
}

function cleanReadableFailure(text = "") {
  return cleanTerminalOutput(String(text || ""))
    .replace(/\s+at\s+[^(]+\([^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getFailurePreview(test) {
  const text = test.failureReason || test.failureMessage || "No failure reason returned by Jest.";
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const importantLines = lines.filter((line) =>
    /Expected|Received|ReferenceError|TypeError|SyntaxError|Cannot|not defined|not a function|toHaveBeenCalledWith|Error:/i.test(
      line
    )
  );

  return (importantLines.length ? importantLines : lines).slice(0, 6).join("\n");
}

function ExecutionResultPanel({
  executingTests,
  testExecutionError,
  testExecutionResult,
  moduleName
}) {
const {
  tests,
  passedTests,
  failedTests,
  total,
  passed,
  failed,
  passPercentage
} = getExecutionStats(testExecutionResult);

const isPassed =
  total > 0
    ? failed === 0
    : Boolean(testExecutionResult?.passed || testExecutionResult?.testResult?.success);
  const rawOutput = cleanTerminalOutput(
    `${testExecutionResult?.output || ""}\n${testExecutionResult?.errorOutput || ""}`
  );
  const functionResults = getFunctionWiseResults(testExecutionResult, tests);

  if (executingTests) {
    return (
      <div className="execution-empty-card execution-loading-card">
        <Loader2 className="spin" size={26} />
        <div>
          <h3>Executing tests inside sandbox...</h3>
          <p>DevSure is running each generated Jest test case and preparing results.</p>
        </div>
      </div>
    );
  }

  if (testExecutionError) {
    return (
      <div className="execution-empty-card execution-error-card">
        <AlertTriangle size={26} />
        <div>
          <h3>Execution request failed</h3>
          <p>{testExecutionError}</p>
        </div>
      </div>
    );
  }

  if (!testExecutionResult) {
    return (
      <div className="execution-empty-card">
        <ClipboardList size={26} />
        <div>
          <h3>No execution yet</h3>
          <p>Run generated test cases to see passed and failed tests with detailed reasons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="execution-readable-report">
      <div className={`execution-hero ${isPassed ? "execution-hero-passed" : "execution-hero-failed"}`}>
        <div className="execution-hero-icon">
          {isPassed ? <CheckCircle2 size={34} /> : <AlertTriangle size={34} />}
        </div>

        <div>
          <span className={`execution-status-chip ${isPassed ? "passed" : "failed"}`}>
            {isPassed ? "All tests passed" : "Some tests failed"}
          </span>
          <h3>{moduleName} execution report</h3>
          <p>{testExecutionResult.message || "Sandbox execution completed."}</p>
        </div>
      </div>

      <div className="execution-summary-grid">
        <div className="execution-summary-card">
          <span>Total Tests</span>
          <strong>{total}</strong>
          <small>Generated test cases executed</small>
        </div>

        <div className="execution-summary-card passed">
          <span>Passed</span>
          <strong>{passed}</strong>
          <small>Working as expected</small>
        </div>

        <div className="execution-summary-card failed">
          <span>Failed</span>
          <strong>{failed}</strong>
          <small>Need review</small>
        </div>

        <div className="execution-summary-card percentage">
          <span>Pass Rate</span>
          <strong>{passPercentage}%</strong>
          <small>Sandbox score</small>
        </div>
      </div>
{/* 
      {(testExecutionResult.sourceFilePath || testExecutionResult.testFilePath) && (
        <div className="execution-path-grid">
          {testExecutionResult.sourceFilePath && (
            <div>
              <span>Source File</span>
              <code>{testExecutionResult.sourceFilePath}</code>
            </div>
          )}

          {testExecutionResult.testFilePath && (
            <div>
              <span>Test File</span>
              <code>{testExecutionResult.testFilePath}</code>
            </div>
          )}
        </div>
      )} */}

      {functionResults.length > 0 && (
        <div className="function-result-section">
          <h4>Function-wise Summary</h4>
          <div className="function-result-grid">
            {functionResults.map((item, index) => (
              <div className="function-result-card" key={`${item.functionName || "function"}-${index}`}>
                <div>
                  <span>Function</span>
                  <strong>{item.functionName || `Function ${index + 1}`}</strong>
                </div>
                <p>
                  <b>{getSafeNumber(item.passed, 0)}</b> passed /{" "}
                  <b>{getSafeNumber(item.failed, 0)}</b> failed /{" "}
                  <b>{getSafeNumber(item.total, 0)}</b> total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="execution-details-grid">
        <TestCaseResultList
          title="Failed Test Cases"
          emptyText="No failed test cases."
          tests={failedTests}
          type="failed"
        />

        <TestCaseResultList
          title="Passed Test Cases"
          emptyText="No passed test cases."
          tests={passedTests}
          type="passed"
        />
      </div>

      {rawOutput && (
        <details className="execution-terminal-dropdown">
          <summary>View Raw Jest Output</summary>
          <pre>{rawOutput}</pre>
        </details>
      )}
    </div>
  );
}

function TestCaseResultList({ title, tests, type, emptyText }) {
  return (
    <section className={`test-result-column ${type}`}>
      <div className="test-result-column-header">
        <h4>{title}</h4>
        <span>{tests.length}</span>
      </div>

      {tests.length === 0 ? (
        <p className="test-result-empty-text">{emptyText}</p>
      ) : (
        <div className="test-result-list">
          {tests.map((test, index) => (
            <article className={`test-result-card ${type}`} key={test.id || index}>
              <div className="test-result-card-header">
                <span className={`test-result-badge ${type}`}>
                  {type === "passed" ? "PASS" : "FAIL"}
                </span>
                <div>
                  <h5>{test.title}</h5>
                  <p>{test.functionName}</p>
                </div>
              </div>

              {type === "failed" && (
                <div className="failure-reason-box">
                  <span>Failure Reason</span>
                  <pre>{getFailurePreview(test)}</pre>
                </div>
              )}

              {type === "failed" && test.failureMessage && (
                <details className="failure-details-dropdown">
                  <summary>View full error</summary>
                  <pre>{test.failureMessage}</pre>
                </details>
              )}

              {type === "passed" && (
                <p className="passed-message">This test case passed successfully.</p>
              )}

              <small>Duration: {test.duration || 0}ms</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FeatureFileReviewPanel({
  creatingFeatureFile,
  featureFileError,
  featureFileDraft,
  featureFileApproved,
  generatingTests,
  onChange,
  onApprove
}) {
  if (creatingFeatureFile) {
    return (
      <section className="feature-file-panel feature-file-loading">
        <div className="feature-file-panel-icon">
          <Loader2 className="spin" size={26} />
        </div>
        <div>
          <span className="feature-file-eyebrow">Creating a feature file</span>
          <h2>Preparing module behavior scenarios...</h2>
          <p>
            DevSure is reading your user rules and module functions to create a
            feature file before test generation starts.
          </p>
        </div>
      </section>
    );
  }

  if (featureFileError) {
    return (
      <section className="feature-file-panel feature-file-error">
        <div className="feature-file-panel-icon error">
          <AlertTriangle size={26} />
        </div>
        <div>
          <span className="feature-file-eyebrow">Feature file failed</span>
          <h2>Unable to create feature file</h2>
          <p>{featureFileError}</p>
        </div>
      </section>
    );
  }

  if (!featureFileDraft) {
    return (
      <section className="feature-file-panel">
        <div className="feature-file-panel-icon">
          <FileText size={26} />
        </div>
        <div>
          <span className="feature-file-eyebrow">Feature file pending</span>
          <h2>Waiting for module rules</h2>
          <p>Submit user rules first so DevSure can create a feature file for review.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`feature-file-panel feature-file-review ${featureFileApproved ? "approved" : ""}`}>
      <div className="feature-file-review-header">
        <div className="feature-file-title-wrap">
          <div className="feature-file-panel-icon">
            {featureFileApproved ? <CheckCircle2 size={26} /> : <FileText size={26} />}
          </div>
          <div>
            <span className="feature-file-eyebrow">
              {featureFileApproved ? "Approved feature file" : "Review feature file"}
            </span>
            <h2>
              {featureFileApproved
                ? "Test generation is using this approved behavior file"
                : "Approve or edit this feature file before test generation"}
            </h2>
            <p>
            This feature file will be used to generate test cases.
            </p>
          </div>
        </div>

        {!featureFileApproved && (
          <button
            type="button"
            className="approve-feature-button"
            disabled={generatingTests || !featureFileDraft.trim()}
            onClick={onApprove}
          >
            {generatingTests ? (
              <>
                <Loader2 className="spin" size={17} />
                Generating Tests...
              </>
            ) : (
              <>
                <CheckCheck size={17} />
                Approve Feature File
              </>
            )}
          </button>
        )}
      </div>

      <label className="feature-file-editor">
        <span>
          <PencilLine size={15} />
          {featureFileApproved ? "Approved feature file content" : "Editable feature file content"}
        </span>
        <textarea
          value={featureFileDraft}
          onChange={(event) => onChange(event.target.value)}
          readOnly={featureFileApproved || generatingTests}
          rows={16}
        />
      </label>
    </section>
  );
}

export default function BuildResultPage({ buildResult, onBack }) {
  const [userStory, setUserStory] = useState("");
  const [testing, setTesting] = useState(false);
  const [generatingTests, setGeneratingTests] = useState(false);
  const [executingTests, setExecutingTests] = useState(false);

  const [testingError, setTestingError] = useState(null);
  const [testExecutionError, setTestExecutionError] = useState(null);
  const [testExecutionResult, setTestExecutionResult] = useState(null);

  const [modulePrompt, setModulePrompt] = useState(null);
  const [moduleResult, setModuleResult] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [functionTestItems, setFunctionTestItems] = useState([]);
  const [testingPageOpen, setTestingPageOpen] = useState(false);
  const [creatingFeatureFile, setCreatingFeatureFile] = useState(false);
  const [featureFileError, setFeatureFileError] = useState(null);
  const [featureFileDraft, setFeatureFileDraft] = useState("");
  const [featureFileApproved, setFeatureFileApproved] = useState(false);
  const [projectModuleReports, setProjectModuleReports] = useState([]);
  const [qualityDashboardOpen, setQualityDashboardOpen] = useState(false);

  const currentModule = modulePrompt?.currentModule || moduleResult?.currentModule;
  const displayedFunctions = functionTestItems.length
    ? functionTestItems
    : moduleResult?.analyzedFunctions || [];

  const entryFile =
    modulePrompt?.entryFile ||
    moduleResult?.entryFile ||
    buildResult?.entryFile ||
    "src/server.js";

  const totalGeneratedTests = displayedFunctions.reduce(
    (total, item) => total + (item.testCases?.length || 0),
    0
  );

  const canExecuteTests =
    displayedFunctions.length > 0 &&
    totalGeneratedTests > 0 &&
    displayedFunctions.every(
      (item) => item.status === "ANALYZED" && item.testCases?.length > 0
    ) &&
    !testing &&
    !generatingTests &&
    !executingTests;

  const controllerFunctions = useMemo(() => {
    const names = modulePrompt?.currentModule?.functionNames || [];
    const prefix =
      modulePrompt?.currentModule?.firstEndpoint?.controllerFunction?.split(".")[0];

    return names.map((name) => (prefix ? `${prefix}.${name}` : name));
  }, [modulePrompt]);

  const resetExecution = () => {
    setTestExecutionResult(null);
    setTestExecutionError(null);
  };

  const resetFeatureFile = () => {
    setCreatingFeatureFile(false);
    setFeatureFileError(null);
    setFeatureFileDraft("");
    setFeatureFileApproved(false);
  };

  const handleCancelModuleRules = () => {
    setIsStoryModalOpen(false);
    setUserStory("");
    setTestingError(null);

    if (!testingPageOpen) {
      setModulePrompt(null);
      setModuleResult(null);
      setFunctionTestItems([]);
      resetFeatureFile();
    }
  };

  const updateFunctionItem = (id, newData) => {
    setFunctionTestItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...newData } : item))
    );
  };

  const requestModulePrompt = async (moduleIndex = 0) => {
    try {
      resetExecution();
      setTesting(true);
      setTestingError(null);
      setQualityDashboardOpen(false);

      if (moduleIndex === 0 && !testingPageOpen) {
        setProjectModuleReports([]);
      }

      if (!testingPageOpen) {
        setFunctionTestItems([]);
        setModuleResult(null);
        resetFeatureFile();
      }

      const result = await startTesting({
        folderPath: buildResult?.folderPath,
        entryFile,
        moduleIndex
      });

      setUserStory("");
      setModulePrompt(result);

      if (result.status === "USER_STORY_REQUIRED") {
        setIsStoryModalOpen(true);
      } else {
        setIsStoryModalOpen(false);
        setModuleResult(result);
        setTestingPageOpen(true);
        await createFeatureFileForModule(result, result.userStory || userStory);
      }
    } catch (error) {
      setTestingError(error);
    } finally {
      setTesting(false);
    }
  };

  const generateTestsForModule = async (result, approvedFeatureFile) => {
    const functions = result?.analyzedFunctions || [];
    if (!functions.length) return;

    setGeneratingTests(true);
    resetExecution();

    const preparedFunctions = functions.map((item) => ({
      ...item,
      status: "PENDING",
      message: `${item.functionName} waiting for test case generation`,
      testCases: [],
      testGenerationError: ""
    }));

    setFunctionTestItems(preparedFunctions);

    for (const item of preparedFunctions) {
      try {
        updateFunctionItem(item.id, {
          status: "ANALYZING",
          message: `${item.functionName} analyzing...`
        });

        const functionCode = item.functionCode || item.code || item.sourceCode || "";

        const data = await generateFunctionTestCases({
          moduleName: result?.currentModule?.moduleName || "Module",
          functionName: item.functionName,
          functionCode,
          controllerFile: item.controllerFile,
          route: item.route,
          method: item.method,
          featureFile: approvedFeatureFile,
          language: "javascript"
        });

        updateFunctionItem(item.id, {
          status: "ANALYZED",
          message: `${item.functionName} successfully analyzed using approved feature file`,
          functionCode,
          controllerFile: item.controllerFile || data.controllerFile,
          route: item.route,
          method: item.method,
          sandbox: data.sandbox,
          sourceFilePath: data.sourceFilePath,
          testFilePath: data.testFilePath,
          testCases: data.testCases || [],
          featureFileUsed: data.featureFileUsed,
          testGenerationError: ""
        });
      } catch (error) {
        updateFunctionItem(item.id, {
          status: "FAILED",
          message: `${item.functionName} test case generation failed`,
          testCases: [],
          testGenerationError: error.message
        });
      }
    }

    setGeneratingTests(false);

    setCompletedModules((modules) => [
      ...modules.filter((item) => item.moduleIndex !== result.moduleIndex),
      result
    ]);
  };


  const createFeatureFileForModule = async (result, rulesText) => {
    if (!result?.currentModule || !rulesText?.trim()) {
      setFeatureFileError("Module information or user rules are missing for feature file generation.");
      return;
    }

    try {
      setCreatingFeatureFile(true);
      setFeatureFileError(null);
      setFeatureFileDraft("");
      setFeatureFileApproved(false);
      setFunctionTestItems([]);

      const data = await generateModuleFeatureFile({
        moduleName: result.currentModule.moduleName || "Module",
        userStory: rulesText.trim(),
        currentModule: result.currentModule,
        functions: result.analyzedFunctions || [],
        apiFlows: result.apiFlows || []
      });

      setFeatureFileDraft(data.featureFile || "");
    } catch (error) {
      setFeatureFileError(error.message || "Unable to create feature file.");
    } finally {
      setCreatingFeatureFile(false);
    }
  };

  const approveFeatureFileAndGenerateTests = async () => {
    if (!featureFileDraft.trim()) {
      setFeatureFileError("Feature file is empty. Please add feature content before approving.");
      return;
    }

    if (!moduleResult) {
      setFeatureFileError("Module analysis result is missing. Please start testing again.");
      return;
    }

    setFeatureFileError(null);
    setFeatureFileApproved(true);
    await generateTestsForModule(moduleResult, featureFileDraft);
  };

  const handleSubmitUserStory = async () => {
    if (!userStory.trim()) {
      setTestingError({ message: "Please enter the user rules for this module first." });
      return;
    }

    try {
      resetExecution();
      setTesting(true);
      setTestingError(null);
      setFunctionTestItems([]);

      const result = await startTesting({
        folderPath: buildResult?.folderPath,
        entryFile,
        moduleIndex: modulePrompt?.moduleIndex || 0,
        userStory: userStory.trim()
      });

      setModuleResult(result);
      setIsStoryModalOpen(false);
      setTestingPageOpen(true);
      setTesting(false);

      await createFeatureFileForModule(result, userStory.trim());
    } catch (error) {
      setTestingError(error);
      setTesting(false);
      setGeneratingTests(false);
    }
  };

  const executeCurrentModuleTests = async () => {
    const originalFunctionMap = new Map(
      (moduleResult?.analyzedFunctions || []).map((item) => [item.functionName, item])
    );

    const functions = displayedFunctions
      .filter((item) => item.testCases?.length > 0)
      .map((item) => {
        const originalItem = originalFunctionMap.get(item.functionName) || {};

        return {
          functionName: item.functionName,
          functionCode:
            item.functionCode ||
            item.code ||
            item.sourceCode ||
            originalItem.functionCode ||
            originalItem.code ||
            "",
          controllerFile: item.controllerFile || originalItem.controllerFile,
          route: item.route || originalItem.route,
          method: item.method || originalItem.method,
          testCases: item.testCases
        };
      });

    if (!functions.length) {
      setTestExecutionError("No generated test cases found for execution.");
      return;
    }

    const functionsWithoutCode = functions
      .filter((item) => !String(item.functionCode || "").trim())
      .map((item) => item.functionName);

    if (functionsWithoutCode.length > 0) {
      setTestExecutionError(
        `Missing functionCode for: ${functionsWithoutCode.join(", ")}. Please analyze the module again and regenerate test cases.`
      );
      return;
    }

    try {
      setExecutingTests(true);
      resetExecution();

      const result = await executeModuleTestCases({
        moduleName: currentModule?.moduleName || "Module",
        functions
      });

      setTestExecutionResult(result);

      setProjectModuleReports((reports) =>
        mergeModuleReports(reports, {
          moduleIndex: moduleResult?.moduleIndex ?? currentModule?.moduleIndex ?? 0,
          moduleName: currentModule?.moduleName || "Module",
          basePath: currentModule?.basePath || "",
          totalApis: currentModule?.totalApis || 0,
          featureFile: featureFileDraft,
          functions,
          executionResult: result,
          executedAt: new Date().toISOString()
        })
      );
    } catch (error) {
      setTestExecutionError(error.message);
    } finally {
      setExecutingTests(false);
    }
  };

  const moveToNextModule = () => {
    const nextModuleIndex =
      moduleResult?.nextModule?.moduleIndex ?? (moduleResult?.moduleIndex || 0) + 1;

    resetFeatureFile();
    requestModulePrompt(nextModuleIndex);
  };

  const handleBackButton = () => {
    if (qualityDashboardOpen) {
      setQualityDashboardOpen(false);
      return;
    }

    if (testingPageOpen) {
      setTestingPageOpen(false);
      resetExecution();
      return;
    }

    onBack();
  };

  if (qualityDashboardOpen) {
    return (
      <main className="build-result-page">
        <button className="back-button" onClick={handleBackButton}>
          <ArrowLeft size={17} />
          Back to Testing Workspace
        </button>

        <ProjectQualityDashboard
          reports={projectModuleReports}
          buildResult={buildResult}
          onBackToAnalysis={onBack}
        />
      </main>
    );
  }

  return (
    <main className="build-result-page">
      <button className="back-button" onClick={handleBackButton}>
        <ArrowLeft size={17} />
        {testingPageOpen ? "Back to Build Summary" : "Back to Analysis"}
      </button>

      {!testingPageOpen && (
        <>
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
            Start testing will read mounted routes from the entry point one by one.
            Each module asks for its own user rules before showing only its
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
              Add module rules, analyze controller functions, then AI will generate
              test cases for each function one by one.
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
          disabled={testing || generatingTests}
          onClick={() => requestModulePrompt(0)}
        >
          {testing && !isStoryModalOpen ? (
            <>
              <Loader2 className="spin" size={18} />
              Finding First Module...
            </>
          ) : generatingTests ? (
            <>
              <Loader2 className="spin" size={18} />
              Generating Test Cases...
            </>
          ) : (
            <>
              <PlayCircle size={18} />
              Start Testing
            </>
          )}
        </button>
      </section>
        </>
      )}

      {testingPageOpen && (
        <>
          <section className="module-testing-hero">
            <div className="module-testing-hero-icon">
              <FunctionSquare size={30} />
            </div>

            <div>
              <span className="success-badge">Testing Workspace</span>
              <h1>{currentModule?.moduleName || "Module"} test generation</h1>
              <p>DevSure is now generating Jest test cases and showing execution results on this separate testing page.</p>
            </div>
          </section>

          <FeatureFileReviewPanel
            creatingFeatureFile={creatingFeatureFile}
            featureFileError={featureFileError}
            featureFileDraft={featureFileDraft}
            featureFileApproved={featureFileApproved}
            generatingTests={generatingTests}
            onChange={(value) => {
              setFeatureFileDraft(value);
              setFeatureFileApproved(false);
              setFunctionTestItems([]);
              resetExecution();
            }}
            onApprove={approveFeatureFileAndGenerateTests}
          />

      <section className="api-flow-panel">
        <div className="panel-header compact-panel-header">
          <h2>Testing Flow</h2>
          <p>
            {creatingFeatureFile
              ? "Creating a feature file from user rules before test generation..."
              : featureFileDraft && !featureFileApproved
              ? "Review the feature file. You can edit it, then approve it to generate test cases."
              : generatingTests
              ? "Generating test cases one by one using the approved feature file..."
              : moduleResult?.message ||
                modulePrompt?.message ||
                "Click Start Testing to find the first mounted route module."}
          </p>
        </div>

        <div className="api-flow-summary">
          <div>
            <Network size={20} />
            <span>{currentModule?.totalApis || 0} Module APIs</span>
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

        {displayedFunctions.length > 0 && (
          <div className="analyzed-functions-panel">
            <div className="analyzed-functions-title">
              <div className="analyzed-functions-title-icon">
                <CheckCheck size={20} />
              </div>

              <div>
                <span>Analyze Functions</span>
                <h3>{currentModule?.moduleName || "Current Module"}</h3>
              </div>

              <div className="analyzed-functions-stats">
                <strong>{displayedFunctions.length}</strong>
                <small>functions</small>
              </div>
            </div>

            <div className="analyzed-functions-list">
              {displayedFunctions.map((item, functionIndex) => {
                const testCount = item.testCases?.length || 0;
                const groupedCases = groupTestCases((item.testCases || []).slice(0, 10));
                const statusClass =
                  item.status === "ANALYZING"
                    ? "status-analyzing"
                    : item.status === "FAILED"
                    ? "status-failed"
                    : "status-analyzed";

                return (
                  <article className="analyzed-function-card" key={item.id}>
                    <div className="analyzed-function-header">
                      <div className="function-title-wrap">
                        <div className="function-number-badge">{functionIndex + 1}</div>

                        <div>
                          <span className="function-eyebrow">Controller Function</span>
                          <h4>{item.functionName}</h4>
                        </div>
                      </div>

                      <div className="function-meta-actions">
                        <span className="generated-count-badge">
                          {testCount} generated
                        </span>
                        <span className={`function-status-pill ${statusClass}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="function-message-row">
                      <p>{item.message || "Function analyzed successfully"}</p>

                      {item.testGenerationError && (
                        <p className="testcase-error-text">{item.testGenerationError}</p>
                      )}
                    </div>

                    {testCount > 0 && (
                      <details className="function-tests-dropdown" open>
                        <summary className="function-tests-summary">
                          <div>
                            <span className="summary-pill">Generated Test Cases</span>
                            <small>{item.functionName}</small>
                          </div>

                          <span className="summary-count">{testCount} tests</span>
                        </summary>

                        <div className="generated-testcases-box">
                          <div className="testcase-category-list-wrapper">
                            {groupedCases.map((group) => (
                              <details
                                className={`testcase-category-dropdown category-${group.key}`}
                                key={group.key}
                                open
                              >
                                <summary className="testcase-category-summary">
                                  <div>
                                    <span className="category-dot" />
                                    <span className="summary-pill">{group.label}</span>
                                  </div>

                                  <span className="summary-count">{group.items.length} tests</span>
                                </summary>

                                <div className="testcase-category-list">
                                  {group.items.map((testCase, index) => (
                                    <div className="generated-testcase-card" key={index}>
                                      <div className="generated-testcase-card-header">
                                        <span className="testcase-index">TC-{index + 1}</span>

                                        <h5>
                                          {testCase.scenarioTitle ||
                                            testCase.title ||
                                            `Test Case ${index + 1}`}
                                        </h5>
                                      </div>

                                      {(testCase.scenarioDescription ||
                                        testCase.description) && (
                                        <p className="testcase-description">
                                          {testCase.scenarioDescription ||
                                            testCase.description}
                                        </p>
                                      )}

                                      <div className="testcase-info-grid">
                                        {testCase.inputExample && (
                                          <div>
                                            <span>Input</span>
                                            <p>{testCase.inputExample}</p>
                                          </div>
                                        )}

                                        {testCase.expectedResult && (
                                          <div>
                                            <span>Expected</span>
                                            <p>{testCase.expectedResult}</p>
                                          </div>
                                        )}
                                      </div>

                                      {testCase.jestCode && (
                                        <details className="jest-code-dropdown">
                                          <summary>View Jest Code</summary>
                                          <pre>
                                            <code>{testCase.jestCode}</code>
                                          </pre>
                                        </details>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="module-testing-actions">
              <button
                type="button"
                className="next-module-button execute-tests-button"
                disabled={!canExecuteTests}
                onClick={executeCurrentModuleTests}
                title={
                  canExecuteTests
                    ? "Execute generated tests"
                    : "Wait until all functions are analyzed"
                }
              >
                {executingTests ? (
                  <>
                    <Loader2 className="spin" size={18} />
                    Executing Tests...
                  </>
                ) : (
                  <>
                    <PlayCircle size={18} />
                    Execute Tests
                  </>
                )}
              </button>

              {moduleResult?.hasNextModule ? (
                <button
                  type="button"
                  className="next-module-button"
                  disabled={testing || generatingTests || executingTests || !testExecutionResult}
                  onClick={moveToNextModule}
                  title={testExecutionResult ? "Move to the next module" : "Execute this module tests before moving ahead"}
                >
                  <ArrowRight size={18} />
                  Move to Next Module
                </button>
              ) : (
                <button
                  type="button"
                  className="next-module-button quality-report-button"
                  disabled={testing || generatingTests || executingTests || !testExecutionResult}
                  onClick={() => setQualityDashboardOpen(true)}
                  title={testExecutionResult ? "View complete project quality report" : "Execute the final module tests to unlock the report"}
                >
                  <ClipboardList size={18} />
                  View Project Quality Report
                </button>
              )}
            </div>
          </div>
        )}

        {(completedModules.length > 0 || projectModuleReports.length > 0) && (
          <div className="completed-modules-strip">
            {completedModules.map((moduleItem) => {
              const report = projectModuleReports.find(
                (item) => Number(item.moduleIndex) === Number(moduleItem.moduleIndex)
              );
              const stats = report ? getModuleReportStats(report) : null;

              return (
                <span key={moduleItem.moduleIndex}>
                  {moduleItem.currentModule?.moduleName} {stats ? `${stats.passed}/${stats.total} passed` : "analyzed"}
                </span>
              );
            })}
          </div>
        )}

        {!currentModule && (
          <div className="api-flow-empty testing-empty-state">
            <ClipboardList size={22} />
            Waiting for module rules or test generation to start.
          </div>
        )}
      </section>

      <section className="build-output-panel execution-result-panel">
        <div className="panel-header execution-panel-header">
          <div>
            <span className="execution-panel-eyebrow">Sandbox Result</span>
            <h2>Test Execution Result</h2>
          </div>
          <p>
            {testExecutionResult
              ? testExecutionResult.message
              : "Run generated test cases to view readable pass/fail details here."}
          </p>
        </div>

        <ExecutionResultPanel
          executingTests={executingTests}
          testExecutionError={testExecutionError}
          testExecutionResult={testExecutionResult}
          moduleName={currentModule?.moduleName || "Module"}
        />
      </section>
        </>
      )}

      {isStoryModalOpen && modulePrompt?.currentModule && (
        <div className="module-story-modal-backdrop">
          <section className="module-story-modal">
            <button
              type="button"
              onClick={handleCancelModuleRules}
              aria-label="Close module rules popup"
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                width: "40px",
                height: "40px",
                padding: 0,
                borderRadius: "50%",
                border: "1px solid rgba(148, 163, 184, 0.22)",
                background: "rgba(15, 23, 42, 0.95)",
                color: "#cbd5e1",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 50,
                boxShadow: "0 10px 26px rgba(0, 0, 0, 0.35)"
              }}
              >
              <X size={20} strokeWidth={2.5} /> 
            </button>
            <div className="module-story-modal-icon">
              <FunctionSquare size={24} />
            </div>

            <span className="success-badge">Module Found</span>
            <h2>{modulePrompt.currentModule.moduleName} Module</h2>

            {controllerFunctions.length > 0 && (
              <div className="first-endpoint-card">
                <span>Controller Functions Found</span>

                <div className="module-function-list">
                  {controllerFunctions.map((name) => (
                    <strong key={name}>{name}</strong>
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
