import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Check,
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
  Boxes,
  ArrowRight,
  ChevronRight,
  FileText,
  Code2,
  ShieldCheck,
  Sparkles,
  PencilLine,
  X,
  Maximize2,
  Minimize2,
  Download,
  CircleCheckBig,
  CircleX,
  CalendarDays,
  Clock3,
  PieChart,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Copy,
  List
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
  return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "").trim();
}

function ResizeControl({ expanded, onToggle, label }) {
  return (
    <button type="button" className="workspace-resize-button" onClick={onToggle} aria-label={`${expanded ? "Restore" : "Expand"} ${label}`} title={`${expanded ? "Restore" : "Expand"} ${label}`}>
      {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
      <span>{expanded ? "Restore" : "Expand"}</span>
    </button>
  );
}

function renderFeatureFileLine(line) {
  const keywordMatch = line.match(/^(\s*)(Feature:|Scenario Outline:|Scenario:)(.*)$/i);

  if (!keywordMatch) return line || " ";

  const [, indentation, keyword, remainder] = keywordMatch;
  const isFeature = keyword.toLowerCase() === "feature:";
  const parts = isFeature ? remainder.split(/(auth)/ig) : [remainder];
  return <>{indentation}<span className="feature-keyword">{keyword}</span>{parts.map((part, index) => part.toLowerCase() === "auth" ? <span className="feature-module-name" key={index}>{part}</span> : <Fragment key={index}>{part}</Fragment>)}</>;
}

function highlightJestLine(line) {
  const tokenStyles = {
    keyword: { color: "#d99ade" },
    string: { color: "#8ed67e" },
    function: { color: "#72b9ea" },
    method: { color: "#dfbd68" },
    comment: { color: "#778599" }
  };
  const plainTokenStyle = { background: "transparent", border: 0, borderRadius: 0, padding: 0, boxShadow: "none", font: "inherit", fontWeight: "inherit", textTransform: "none", letterSpacing: "normal", display: "inline" };
  const tokens = String(line || " ").split(/(\/\/.*$|`[^`]*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:test|const|let|var|async|await|expect|describe|it|return|new|true|false|null|undefined)\b|\b[A-Za-z_$][\w$]*(?=\s*\())/g);
  return tokens.map((token, index) => {
    let color = null;
    if (/^\/\//.test(token)) color = tokenStyles.comment.color;
    else if (/^(?:`|"|')/.test(token)) color = tokenStyles.string.color;
    else if (/^(?:test|const|let|var|async|await|expect|describe|it|return|new|true|false|null|undefined)$/.test(token)) color = tokenStyles.keyword.color;
    else if (/^(mockResolvedValue|mockReturnValue|toHaveBeenCalledWith|toHaveBeenCalled|toBe|toEqual|toBeUndefined|toContain|objectContaining)$/i.test(token)) color = tokenStyles.method.color;
    else if (/^[A-Za-z_$][\w$]*$/.test(token)) color = tokenStyles.function.color;
    return <span key={index} style={{ ...plainTokenStyle, ...(color ? { color } : {}) }}>{token}</span>;
  });
}

function JestCodeViewer({ code, functionName, fileName }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const resolvedFileName = fileName || `${functionName || "generated"}.test.js`;
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className={`jest-code-dropdown ${open ? "is-open" : ""}`}>
      <button type="button" className="jest-code-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <ChevronDown size={13} /> {open ? "Hide Jest Code" : "View Jest Code"}
      </button>
      <div className="jest-code-reveal">
        <div className="jest-code-viewer">
          <header className="jest-code-header"><span>{resolvedFileName}</span><button type="button" className="jest-copy-button" onClick={copyCode} aria-label={copied ? "Copied" : "Copy code"}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy code"}</button></header>
          <div className="jest-code-body"><ol>{code.split("\n").map((line, index) => <li key={index}><code>{highlightJestLine(line)}</code></li>)}</ol></div>
        </div>
      </div>
    </div>
  );
}

function ErrorReasonPanel({ error, fallbackTitle = "Operation Failed", compact = false }) {
  if (!error) return null;
  const details = typeof error === "string" ? { description: error } : error;
  const fields = [
    ["Error Title", details.title || fallbackTitle],
    ["Error Description", details.description || details.message || "The operation could not be completed."],
    ["Root Cause", details.rootCause || "The requested service could not complete the operation."],
    ["Suggested Fix", details.suggestedFix || "Check your inputs and connection, then try again."],
    ["Severity", details.severity || "Medium"]
  ];
  return <section className={`error-reason-panel ${compact ? "compact" : ""}`}>{fields.map(([label, value]) => <div key={label}><span>{label}</span><p>{value}</p></div>)}</section>;
}

function getExecutionOutput({
  executingTests = false,
  testExecutionError = null,
  testExecutionResult = null,
  moduleName = "Module"
}) {
  if (executingTests) {
    return "Executing generated test cases...";
  }

  if (testExecutionError) {
    return `Test Execution Failed\n\n${testExecutionError}`;
  }

  if (!testExecutionResult) {
    return "No test execution yet.";
  }

  const rawOutput = cleanTerminalOutput(
    `${testExecutionResult.output || ""}\n${testExecutionResult.errorOutput || ""}`
  );

  if (rawOutput.includes("spawn EINVAL")) {
    return "Test runner could not start properly. Please make sure Jest is installed in the selected project.";
  }

  const failedTests = Number(
    rawOutput.match(/Tests:\s.*?(\d+)\s+failed/i)?.[1] || 0
  );

  const passedTests = Number(
    rawOutput.match(/Tests:\s.*?(\d+)\s+passed/i)?.[1] || 0
  );

  const totalTests = Number(
    rawOutput.match(/Tests:\s.*?(\d+)\s+total/i)?.[1] || 0
  );

  const missingFunctions = [
    ...new Set(
      [...rawOutput.matchAll(/ReferenceError:\s+([a-zA-Z_$][\w$]*)\s+is not defined/g)]
        .map((match) => match[1])
    )
  ];

  const issues = [];

  if (missingFunctions.length > 0) {
    issues.push(`Generated test file is missing imports for: ${missingFunctions.join(", ")}.`);
  }

  if (rawOutput.includes("toThrowError is not a function")) {
    issues.push("Some generated tests used unsupported Jest syntax: .toThrowError().");
  }

  if (rawOutput.includes("npm warn exec")) {
    issues.push("Jest was not installed, so npm tried to run it temporarily.");
  }

  if (issues.length === 0 && failedTests > 0) {
    issues.push("Some generated test cases failed during execution.");
  }

  if (totalTests > 0) {
    return `${moduleName} Test Execution Summary

Total Tests: ${totalTests}
Passed: ${passedTests}
Failed: ${failedTests}

Main Issues:
${issues.length > 0 ? issues.map((issue) => `- ${issue}`).join("\n") : "- No major issues found."}

Suggested Fix:
Generated tests need proper imports, mocks, or API-based testing setup.`;
  }

  return rawOutput || "Tests executed but no output was returned.";
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

function ExecutionResultPanel({ testExecutionResult }) {
const {
  tests,
  passedTests,
  failedTests,
  total,
  passed,
  failed,
  passPercentage
} = getExecutionStats(testExecutionResult);

  const functionResults = getFunctionWiseResults(testExecutionResult, tests);

  return (
    <div className="execution-readable-report">
      <div className="execution-summary-grid">
        <div className="execution-summary-card">
          <span className="summary-metric-icon blue"><ClipboardList size={26} /></span>
          <span>Total Tests</span>
          <strong>{total}</strong>
          <small>Generated test cases executed</small>
        </div>

        <div className="execution-summary-card passed">
          <span className="summary-metric-icon green"><CircleCheckBig size={26} /></span>
          <span>Passed</span>
          <strong>{passed}</strong>
          <small>Working as expected</small>
        </div>

        <div className="execution-summary-card failed">
          <span className="summary-metric-icon red"><CircleX size={26} /></span>
          <span>Failed</span>
          <strong>{failed}</strong>
          <small>Need review</small>
        </div>

        <div className="execution-summary-card percentage">
          <span className="summary-metric-icon blue"><PieChart size={28} /></span>
          <div><span>Pass Rate</span><strong>{passPercentage}%</strong><small>Sandbox score</small></div>
          <div className="pass-rate-ring" style={{ "--pass-rate": `${passPercentage * 3.6}deg` }}><b>{passPercentage}%</b></div>
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
                <div className="function-result-card-title">
                  <Code2 size={22} />
                  <div><strong>{item.functionName || `Function ${index + 1}`}</strong>
                  <p>
                    <b>{getSafeNumber(item.passed, 0)}</b> passed /{" "}
                    <b>{getSafeNumber(item.failed, 0)}</b> failed /{" "}
                    <b>{getSafeNumber(item.total, 0)}</b> total
                  </p></div>
                </div>
                <div className="function-result-progress" aria-label={`${item.functionName} pass rate`}>
                  <i className="passed" style={{ width: `${item.total ? Math.round((item.passed / item.total) * 100) : 0}%` }} />
                  <i className="failed" style={{ width: `${item.total ? Math.round((item.failed / item.total) * 100) : 0}%` }} />
                  <span>{item.total ? Math.round((item.passed / item.total) * 100) : 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="execution-details-grid">
        <TestCaseResultList
          title="Passed Tests"
          emptyText="No passed test cases."
          tests={passedTests}
          type="passed"
        />
        <TestCaseResultList
          title="Failed Tests"
          emptyText="No failed test cases."
          tests={failedTests}
          type="failed"
        />
      </div>

    </div>
  );
}

function ExecutionLoadingPanel({ moduleName }) {
  const stages = ["Preparing test environment...", "Executing test cases...", "Collecting results..."];
  return (
    <section className="execution-loading-panel" aria-live="polite" aria-busy="true">
      <div className="execution-loading-orbit"><Loader2 className="spin" size={38} /></div>
      <span className="execution-panel-eyebrow">Sandbox execution</span>
      <h2>Running Test Suite</h2>
      <p>Executing generated test cases in the backend sandbox...</p>
      <div className="execution-progress-track"><i /></div>
      <div className="execution-stage-list">
        {stages.map((stage, index) => <span key={stage} className={index === 1 ? "active" : ""}><i />{stage}</span>)}
      </div>
      <small>{moduleName} tests are running. This may take a moment.</small>
    </section>
  );
}

function TestCaseResultList({ title, tests, type, emptyText }) {
  const [query, setQuery] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterMenuRef = useRef(null);
  useEffect(() => {
    if (!filterOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!filterMenuRef.current?.contains(event.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [filterOpen]);
  const functionNames = [...new Set(tests.map((test) => test.functionName).filter(Boolean))];
  const visibleTests = tests.filter((test) =>
    `${test.title} ${test.functionName}`.toLowerCase().includes(query.toLowerCase()) &&
    (selectedFunction === "all" || test.functionName === selectedFunction)
  );
  const displayedTests = showAll || query ? visibleTests : visibleTests.slice(0, 3);
  const testNumber = (test, index) => test.id?.match(/(?:TC-|test-)(\d+)$/i)?.[1] || index + 1;

  return (
    <section className={`execution-test-table-section ${type}`}>
      <div className="execution-test-table-toolbar">
        <h4>{title} ({tests.length})</h4>
        <div className="execution-table-controls">
          <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tests..." /></label>
          <div className="execution-filter-menu" ref={filterMenuRef}><button type="button" onClick={() => setFilterOpen((value) => !value)} aria-expanded={filterOpen} aria-haspopup="menu"><SlidersHorizontal size={16} />{selectedFunction === "all" ? "Filter" : selectedFunction}<ChevronDown size={15} /></button>{filterOpen && <div className="execution-filter-options" role="menu"><button type="button" role="menuitem" onClick={() => { setSelectedFunction("all"); setFilterOpen(false); }}>All functions</button>{functionNames.map((functionName) => <button key={functionName} type="button" role="menuitem" onClick={() => { setSelectedFunction(functionName); setFilterOpen(false); }}>{functionName}</button>)}</div>}</div>
        </div>
      </div>

      {visibleTests.length === 0 ? (
        <p className="execution-table-empty">{query ? "No matching test cases." : emptyText}</p>
      ) : (
        <div className="execution-table-wrap"><table className="execution-test-table"><thead><tr><th>Test Case</th><th>Description</th><th>Function</th><th>Status</th><th>Duration</th><th>Action</th></tr></thead><tbody>
          {displayedTests.map((test, index) => <Fragment key={test.id || index}>
            <tr className={selectedTest === test.id ? "selected" : ""}>
              <td>TC-{testNumber(test, index)}</td><td>{test.title}</td><td>{test.functionName}</td><td><span className={`table-status ${type}`}>{type === "passed" ? <CircleCheckBig size={17} /> : <CircleX size={17} />}{type === "passed" ? "Passed" : "Failed"}</span></td><td>{test.duration || 0} ms</td>
              <td><button type="button" className="execution-table-action" onClick={() => setSelectedTest(selectedTest === test.id ? null : test.id)}>{type === "passed" ? <Code2 size={16} /> : <List size={16} />}{selectedTest === test.id ? "Hide Details" : type === "passed" ? "View Code" : "View Details"}</button></td>
            </tr>
            {selectedTest === test.id && <tr className="execution-test-detail-row"><td colSpan="6"><div className={`execution-test-detail ${type}`}><strong>{type === "failed" ? "Failure Reason" : "Test Result"}</strong><pre>{type === "failed" ? getFailurePreview(test) : "This test case passed successfully in the backend sandbox."}</pre></div></td></tr>}
          </Fragment>)}
        </tbody></table></div>
      )}
      {!query && visibleTests.length > 3 && <button type="button" className={`view-all-tests-button ${type}`} onClick={() => setShowAll((value) => !value)}>{showAll ? "Show fewer tests" : `View all ${type === "passed" ? "passed" : "failed"} tests (${visibleTests.length})`}<ArrowRight size={17} /></button>}
    </section>
  );
}

function FeatureFileReviewPanel({
  creatingFeatureFile,
  featureFileError,
  featureFileDraft,
  featureFileApproved,
  featureFilePath,
  generatingTests,
  onChange,
  onApprove
}) {
  const [expanded, setExpanded] = useState(false);
  const [editorScrollTop, setEditorScrollTop] = useState(0);
  if (featureFileError) {
    return (
      <section className="feature-file-panel feature-file-error">
        <div className="feature-file-panel-icon error">
          <AlertTriangle size={26} />
        </div>
        <div>
          <span className="feature-file-eyebrow">Feature file failed</span>
          <h2>Unable to create feature file</h2>
          <ErrorReasonPanel error={featureFileError} fallbackTitle="Feature File Generation Failed" />
        </div>
      </section>
    );
  }

  if (!featureFileDraft && !creatingFeatureFile) {
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
              {creatingFeatureFile ? "Creating feature file" : featureFileApproved ? "Approved feature file" : "Review feature file"}
            </span>
            <h2>
              {creatingFeatureFile
                ? "Generating Module Behavior Scenarios..."
                : featureFileApproved
                ? "Test generation is using this approved behavior file"
                : "Approve or edit this feature file before test generation"}
            </h2>
            <p>
            This feature file will be used to generate test cases.
            </p>
          </div>
        </div>

        <ResizeControl expanded={expanded} onToggle={() => setExpanded((value) => !value)} label="Feature File Editor" />

        {!featureFileApproved && !creatingFeatureFile && (
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

      {/* {featureFilePath && (
        <div className="feature-file-path-card">
          <span>Sandbox Feature File</span>
          <code>{featureFilePath}</code>
        </div>
      )} */}

      <label className="feature-file-editor">
        <span>
          <PencilLine size={15} />
          {creatingFeatureFile ? <>Generating feature file content<span className="waiting-dots compact" aria-label="Generating"><i>.</i><i>.</i><i>.</i></span></> : featureFileApproved ? "Approved feature file content" : "Editable feature file content"}
        </span>
        <div className={`feature-editor-shell resizable-workspace ${expanded ? "is-expanded" : ""}`}>
          {expanded && (
            <button type="button" className="feature-editor-restore" onClick={() => setExpanded(false)}>
              <Minimize2 size={16} /> Restore
            </button>
          )}
          <pre className="feature-file-line-numbers" aria-hidden="true" style={{ transform: `translateY(-${editorScrollTop}px)` }}>
            {featureFileDraft.split("\n").map((_, index) => <span key={index}>{index + 1}</span>)}
          </pre>
          <pre className="feature-file-syntax" aria-hidden="true" style={{ transform: `translateY(-${editorScrollTop}px)` }}>
            {featureFileDraft.split("\n").map((line, index) => <span key={index}>{renderFeatureFileLine(line)}</span>)}
          </pre>
          <textarea
            value={featureFileDraft}
            onChange={(event) => onChange(event.target.value)}
            onScroll={(event) => setEditorScrollTop(event.currentTarget.scrollTop)}
            readOnly={featureFileApproved || generatingTests}
            rows={16}
          />
        </div>
      </label>
    </section>
  );
}

export default function BuildResultPage({ buildResult, onBack }) {
  const analysisStats = buildResult?.analysisStats || {};
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
  const [featureFilePath, setFeatureFilePath] = useState("");
  const [projectModuleReports, setProjectModuleReports] = useState([]);
  const [qualityDashboardOpen, setQualityDashboardOpen] = useState(false);
  const [executionReportOpen, setExecutionReportOpen] = useState(false);
  const [executionCompletedAt, setExecutionCompletedAt] = useState(null);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);

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
    setExecutionReportOpen(false);
    setExecutionCompletedAt(null);
  };

  const resetFeatureFile = () => {
    setCreatingFeatureFile(false);
    setFeatureFileError(null);
    setFeatureFileDraft("");
    setFeatureFileApproved(false);
    setFeatureFilePath("");
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

      setModulePrompt(result);

      if (result.status === "USER_STORY_REQUIRED") {
        setIsStoryModalOpen(true);
      } else {
        setIsStoryModalOpen(false);
        setModuleResult(result);
        setTestingPageOpen(true);
        await createFeatureFileForModule(result, result.userStory);
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
          testGenerationError: error.details || { description: error.message }
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
      setFeatureFilePath("");
      setFunctionTestItems([]);

      const data = await generateModuleFeatureFile({
        moduleName: result.currentModule.moduleName || "Module",
        userStory: rulesText.trim(),
        currentModule: result.currentModule,
        functions: result.analyzedFunctions || [],
        apiFlows: result.apiFlows || [],
        onChunk: (content) => setFeatureFileDraft((current) => current + content)
      });

      setFeatureFilePath(data.featureFilePath || "");
    } catch (error) {
      setFeatureFileError(error.details || { description: error.message || "Unable to create feature file." });
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
      setExecutionCompletedAt(new Date().toISOString());
      setExecutionReportOpen(true);

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

  const skipCurrentModule = () => {
    const nextModuleIndex = (modulePrompt?.currentModule?.moduleIndex || 0) + 1;
    setIsStoryModalOpen(false);
    setUserStory("");
    setFunctionTestItems([]);
    resetFeatureFile();
    requestModulePrompt(nextModuleIndex);
  };

  const handleBackButton = () => {
    if (executionReportOpen) {
      setExecutionReportOpen(false);
      return;
    }

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

  const downloadExecutionReport = () => {
    if (!testExecutionResult) return;

    const stats = getExecutionStats(testExecutionResult);
    const rows = stats.tests.map((test) =>
      `${test.status.toUpperCase()} | ${test.functionName} | ${test.title} | ${test.duration || 0}ms${test.failureReason ? ` | ${test.failureReason}` : ""}`
    );
    const reportText = [
      `${currentModule?.moduleName || "Auth"} Execution Report`,
      "Generated tests were executed in the backend sandbox.",
      "",
      `Total Tests: ${stats.total}`,
      `Passed: ${stats.passed}`,
      `Failed: ${stats.failed}`,
      `Pass Rate: ${stats.passPercentage}%`,
      "",
      "Test Results",
      ...rows
    ].join("\n");
    const url = URL.createObjectURL(new Blob([reportText], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(currentModule?.moduleName || "auth").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-execution-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
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

  if (executionReportOpen && testExecutionResult) {
    const stats = getExecutionStats(testExecutionResult);
    const isPassed = stats.total > 0 ? stats.failed === 0 : Boolean(testExecutionResult.passed || testExecutionResult.testResult?.success);
    const completedAt = executionCompletedAt ? new Date(executionCompletedAt) : new Date();
    const completionDate = completedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const completionTime = completedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return (
      <main className="build-result-page execution-report-page">
        <section className="execution-report-header">
          <div>
            <span className={`execution-report-badge ${isPassed ? "passed" : "failed"}`}>SANDBOX RESULT</span>
            <h1>Auth Execution Report</h1>
            <p className="execution-completion"><CalendarDays size={15} />Execution completed on {completionDate}<i /> <Clock3 size={15} />{completionTime}<i /> Environment: <b>Sandbox</b></p>
          </div>
          <div className="execution-report-actions">
            <button type="button" className="download-report-button" onClick={downloadExecutionReport}><Download size={17} />Download Report</button>
            <button type="button" className="back-to-generation-button" onClick={handleBackButton}><ArrowLeft size={17} />Back to Test Generation</button>
          </div>
        </section>
        <ExecutionResultPanel testExecutionResult={testExecutionResult} />
      </main>
    );
  }

  return (
    <main className="build-result-page">
      <header className="build-page-topbar">
        <div className="build-page-brand"><Code2 size={21} /><strong>DevSure Analyzer</strong></div>
        <button className="back-button" onClick={handleBackButton}>
          <ArrowLeft size={17} />
          {testingPageOpen ? "Back to Build Summary" : "Back to Analysis"}
        </button>
      </header>

      {!testingPageOpen && (
        <>
      <section className="build-success-hero">
        <div className="build-hero-main">
          <div className="success-orb"><CheckCircle2 size={46} /></div>
          <div className="build-hero-copy">
            <span className="success-badge"><Rocket size={15} /> Build Successful</span>
            <h1>Project is ready for module testing</h1>
            <p>Start testing to analyze your modules, define rules, and generate test cases for controller functions.</p>
          </div>
        </div>
        <div className="build-hero-visual" aria-hidden="true">
          <div className="hero-spark spark-one" />
          <div className="hero-spark spark-two" />
          <div className="hero-spark spark-three" />
          <div className="hero-code-window"><div className="hero-window-dots"><i /><i /><i /></div><Code2 size={45} /><span /><span /><span /><span /></div>
          <div className="hero-platform" />
          <div className="hero-shield"><ShieldCheck size={43} /></div>
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

      <section className="build-checks-row" aria-label="Analysis and build summary">
        <BuildCheck icon={CheckCircle2} label="All Checks" value={analysisStats.totalFiles} detail="Completed" tone="success" />
        <BuildCheck icon={FileCheck2} label="Passed" value={analysisStats.parsedFiles} detail={analysisStats.totalFiles ? `${Math.round((analysisStats.parsedFiles / analysisStats.totalFiles) * 100)}%` : "N/A"} tone="passed" />
        <BuildCheck icon={X} label="Failed" value={analysisStats.failedFiles} detail={analysisStats.totalFiles ? `${Math.round(((analysisStats.failedFiles || 0) / analysisStats.totalFiles) * 100)}%` : "N/A"} tone="failed" />
        <BuildCheck icon={AlertTriangle} label="Warnings" value={analysisStats.unsupportedFiles} detail={analysisStats.totalFiles ? `${Math.round((analysisStats.unsupportedFiles / analysisStats.totalFiles) * 100)}%` : "N/A"} tone="warning" />
        <BuildCheck icon={Route} label="API Routes" value={analysisStats.totalApiRoutes} tone="route" />
        <BuildCheck icon={Boxes} label="Classes" value={analysisStats.totalClasses} tone="classes" />
        <BuildCheck icon={FunctionSquare} label="Functions" value={analysisStats.totalFunctions} tone="functions" />
      </section>

      <section className="testing-next-grid">
      <div className="testing-start-card">
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
      </div>
      <aside className="testing-next-card">
        <h2>What happens next?</h2>
        <ul>
          <li><span className="next-step-icon"><Route size={18} /></span>Routes are discovered from the entry point</li>
          <li><span className="next-step-icon"><Boxes size={18} /></span>Modules are analyzed individually</li>
          <li><span className="next-step-icon"><ClipboardList size={18} /></span>Define rules for each module</li>
          <li><span className="next-step-icon"><Sparkles size={18} /></span>AI generates test cases for controller functions</li>
        </ul>
      </aside>
      </section>
        </>
      )}

      {testingPageOpen && (
        <>
          <section className="module-testing-hero">
            <div className="module-testing-hero-icon">
              <FunctionSquare size={30} />
            </div>

            <div className="module-testing-hero-copy">
              <span className="success-badge">Testing Workspace</span>
              <h1>{currentModule?.moduleName || "Module"} Test Generation</h1>
              <p>DevSure is generating Jest test cases and will show execution results here.</p>
            </div>

            <div className="testing-hero-visual" aria-hidden="true">
              <div className="testing-code-window">
                <div className="testing-window-dots"><i /><i /><i /></div>
                <span /><span /><span /><span />
              </div>
              <div className="testing-shield"><ShieldCheck size={36} /></div>
            </div>
          </section>

          <FeatureFileReviewPanel
            creatingFeatureFile={creatingFeatureFile}
            featureFileError={featureFileError}
            featureFileDraft={featureFileDraft}
            featureFileApproved={featureFileApproved}
            featureFilePath={featureFilePath}
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
          <p>Follow these steps to analyze functions, define rules, and generate test cases.</p>
        </div>

        <div className="testing-flow-steps" aria-label="Testing flow steps">
          <div className="testing-flow-step"><span className="flow-icon"><Network size={20} /></span><b>1</b><div><strong>Analyze Functions</strong><small>Discover controller functions</small></div></div>
          <ArrowRight className="flow-arrow" size={22} />
          <div className="testing-flow-step"><span className="flow-icon"><ClipboardList size={20} /></span><b>2</b><div><strong>Define Rules</strong><small>Add rules for each function</small></div></div>
          <ArrowRight className="flow-arrow" size={22} />
          <div className="testing-flow-step"><span className="flow-icon"><PlayCircle size={20} /></span><b>3</b><div><strong>Generate &amp; Execute</strong><small>Generate and run test cases</small></div></div>
        </div>

        <div className="api-flow-summary">
          <div><Network size={18} /><span>{currentModule?.totalApis || 0} Module APIs</span></div>
          <div><Route size={18} /><span>{entryFile}</span></div>
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
          <div className={`analyzed-functions-panel resizable-workspace ${analysisExpanded ? "is-expanded" : ""}`}>
            <div className="analyzed-functions-title">
              <div className="analyzed-functions-title-icon">
                <CheckCheck size={20} />
              </div>

              <div>
                <span>Functions Analyzed</span>
                <h3>{currentModule?.moduleName || "Current Module"}</h3>
                <p className="analyzed-module-description">All controller functions have been analyzed successfully</p>
              </div>

              <div className="analyzed-functions-stats">
                <Boxes size={18} />
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
                          <p className="function-inline-message">{item.message || "Function analyzed successfully"}</p>
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
                      {item.testGenerationError && (
                        <ErrorReasonPanel error={item.testGenerationError} fallbackTitle="Test Case Generation Failed" compact />
                      )}
                    </div>

                    {testCount > 0 && (
                      <details className="function-tests-dropdown">
                        <summary className="function-tests-summary">
                          <span className="generated-tests-document-icon"><FileText size={21} /></span>
                          <div>
                            <span className="summary-pill">Generated Test Cases</span>
                            <small>{item.functionName}</small>
                          </div>

                          <ChevronRight className="generated-tests-chevron" size={21} />
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
                                        <JestCodeViewer
                                          code={testCase.jestCode}
                                          functionName={item.functionName}
                                          fileName={testCase.testFileName || testCase.fileName}
                                        />
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

      {executingTests ? (
        <ExecutionLoadingPanel moduleName={currentModule?.moduleName || "Module"} />
      ) : (
        <section className="build-output-panel execution-result-panel">
          <div className="panel-header execution-panel-header">
            <div>
              <span className="execution-panel-eyebrow">Sandbox Result</span>
              <h2>Test Execution Result</h2>
            </div>
            <p>Run the generated test cases to view detailed pass/fail results.</p>
          </div>
          <div className={`execution-empty-card ${testExecutionError ? "execution-error-card" : ""}`}>
            {testExecutionError ? <AlertTriangle size={26} /> : <ClipboardList size={26} />}
            <div>
              <h3>{testExecutionError ? "Execution request failed" : "No Test Execution Yet"}</h3>
              <p>{testExecutionError || "Run the generated test cases to view detailed pass/fail results."}</p>
            </div>
          </div>
        </section>
      )}
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
                position: "fixed",
                top: "20px",
                right: "20px",
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
            <div className="module-rules-visual" aria-hidden="true"><div className="module-rules-code"><i /><i /><i /><i /></div><ShieldCheck size={45} /></div>

            {controllerFunctions.length > 0 && (
              <div className="first-endpoint-card">
                <span>Controller Functions Found</span>

                <div className="module-function-list">
                  {controllerFunctions.map((name) => (
                    <strong key={name}><FunctionSquare size={19} /><span>{name}</span></strong>
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
            <button
              type="button"
              className="skip-module-button"
              disabled={testing}
              onClick={skipCurrentModule}
            >
              <ArrowRight size={17} />
              Skip Module
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function BuildCheck({ icon: Icon, label, value, detail, tone }) {
  return <article className={`build-check ${tone}`}>
    <span className="build-check-icon"><Icon size={27} /></span>
    <div><small>{label}</small><strong>{value ?? "—"}</strong>{detail && <em>{detail}</em>}</div>
  </article>;
}
