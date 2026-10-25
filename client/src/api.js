// Shared by the student module and authentication screens.
export async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(path, options);
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot reach the server. Check that both React and Express are running.", { cause: error });
  }

  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `The server returned an empty response (HTTP ${response.status}). Check the Express terminal and wait for the database connection before trying again.`
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `The server returned an unexpected response (HTTP ${response.status}). Check the Express and React terminals for errors.`
    );
  }

  if (!response.ok) {
    throw new Error(data?.message || `The request failed (HTTP ${response.status}).`);
  }

  return data;
}
