const API_BASE_URL = "http://localhost:5000/api";

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
  apiFlows
}) {
  const response = await fetch(`${API_BASE_URL}/testing/feature-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      moduleName,
      userStory,
      currentModule,
      functions,
      apiFlows
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.ollamaError ||
      data.error ||
      data.message ||
      "Failed to generate feature file"
    );
  }

  return data;
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
  throw new Error(
    data.ollamaError ||
    data.error ||
    data.message ||
    "Failed to generate test cases"
  );
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