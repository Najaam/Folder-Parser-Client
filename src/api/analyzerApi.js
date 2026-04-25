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