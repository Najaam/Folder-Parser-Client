import { authenticatedRequest } from "./authApi";

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
  apiFlows
}) {
  const data = await authenticatedRequest("/testing/feature-file", {
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
  const data = await authenticatedRequest("/testing/generate", {
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

  return authenticatedRequest("/testing/execute-module", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
