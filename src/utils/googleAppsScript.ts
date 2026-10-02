/**
 * POST a Google Apps Script sin disparar preflight CORS.
 * No enviar Content-Type: application/json — el cuerpo va como text/plain.
 */
export async function postToGoogleAppsScript(
  scriptUrl: string,
  payload: Record<string, unknown>
): Promise<Response> {
  return fetch(scriptUrl, {
    method: "POST",
    redirect: "follow",
    body: JSON.stringify(payload),
  });
}
