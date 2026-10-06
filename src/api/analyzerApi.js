const API_BASE_URL = "http://localhost:5000/api";

function createApiError(data, fallbackMessage) {
  const error = new Error(data?.message || fallbackMessage);
  error.details = data?.error || null;
  return error;
}

export async function analyzeLocalFolder(folderPath) {
  const response = await fetch(`${API_BASE_URL}/analyze/local-folder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ folderPath })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to analyze folder");
  }

  return data;
}

export async function buildLocalFolder({ folderPath }) {
  const response = await fetch(`${API_BASE_URL}/build/local-folder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ folderPath })
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}

export async function startTesting({ folderPath, entryFile, userStory, moduleIndex }) {
  const response = await fetch(`${API_BASE_URL}/testing/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ folderPath, entryFile, userStory, moduleIndex })
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}


export async function generateModuleFeatureFile({
  moduleName,
  userStory,
  currentModule,
  functions,
  apiFlows,
  onChunk
}) {
  const response = await fetch(`${API_BASE_URL}/testing/feature-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream"
    },
    body: JSON.stringify({
      moduleName,
      userStory,
      currentModule,
      functions,
      apiFlows
    })
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw createApiError(data, "Failed to generate feature file");
  }

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
      const data = JSON.parse(dataLine.slice(5));
      if (event === "chunk") onChunk?.(data.data?.content || "");
      if (event === "complete") completedData = data.data || {};
      if (event === "error") throw createApiError(data, "Failed to generate feature file");
    }
    if (done) break;
  }

  return completedData || {};
}

// NEW FUNCTION: Ollama se function ke test cases generate karwana
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
  const response = await fetch(`${API_BASE_URL}/testing/generate`, {
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

  const data = await response.json();

if (!response.ok || !data.success) {
  throw createApiError(data, "Failed to generate test cases");
}

  return data;
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

  const response = await fetch(`${API_BASE_URL}/testing/execute-module`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to execute module tests");
  }

  return data;
}
