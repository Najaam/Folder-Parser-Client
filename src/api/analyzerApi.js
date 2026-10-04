import { authenticatedRequest, getAccessToken } from "./authApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function createApiError(data, fallbackMessage) {
  const error = new Error(data?.message || fallbackMessage);
  error.details = data?.error || null;
  return error;
}

export async function analyzeLocalFolder(folderPath) {
  return authenticatedRequest("/analyze/local-folder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ folderPath })
  });
}

export async function buildLocalFolder({ folderPath }) {
  return authenticatedRequest("/build/local-folder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ folderPath })
  });
}

export async function startTesting({ folderPath, entryFile, userStory, moduleIndex }) {
  return authenticatedRequest("/testing/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ folderPath, entryFile, userStory, moduleIndex })
  });
}

export async function generateModuleFeatureFile({
  moduleName,
  userStory,
  currentModule,
  functions,
  apiFlows,
  onChunk
}) {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "text/event-stream, application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/testing/feature-file`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      moduleName,
      userStory,
      currentModule,
      functions,
      apiFlows
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw createApiError(errorData, "Failed to generate feature file");
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/event-stream") && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completedData = null;

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const rawEvent of events) {
        const event = rawEvent.match(/^event:\s*(.+)$/m)?.[1];
        const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
        if (!dataLine) continue;
        try {
          const data = JSON.parse(dataLine.slice(5));
          if (event === "chunk") onChunk?.(data.data?.content || "");
          if (event === "complete") completedData = data.data || {};
          if (event === "error") throw createApiError(data, "Failed to generate feature file");
        } catch {
          // ignore parsing error for chunk
        }
      }
      if (done) break;
    }
    return completedData || {};
  }

  // Standard JSON response from backend
  const data = await response.json();
  if (data.featureFile && typeof onChunk === "function") {
    onChunk(data.featureFile);
  }
  return data;
}

export async function generateFunctionTestCases({
  moduleName,
  functionName,
  functionCode,
  controllerFile,
  route,
  method,
  featureFile,
  language = "javascript"
}) {
  return authenticatedRequest("/testing/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      moduleName,
      functionName,
      functionCode,
      controllerFile,
      route,
      method,
      featureFile,
      language
    })
  });
}

export async function executeModuleTestCases({
  folderPath,
  moduleName,
  functions
}) {
  const payload = {
    moduleName,
    functions
  };

  if (folderPath) {
    payload.folderPath = folderPath;
  }

  return authenticatedRequest("/testing/execute-module", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
