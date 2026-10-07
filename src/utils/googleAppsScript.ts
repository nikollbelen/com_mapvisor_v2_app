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

const SHEET_FIELD_KEYS: Record<string, string[]> = {
  fid: ["FID", "fid"],
  nombre: ["Número", "Numero", "nombre", "Nombre"],
  estado: ["Estado", "estado"],
  precio: ["Precio", "precio"],
  area: ["Área (m²)", "Area (m²)", "Area", "area"],
  etapa: ["Etapa", "etapa"],
  coordenadas: ["Coordenadas", "coordenadas"],
  media: ["Media", "media"],
};

function getSheetValue(row: Record<string, unknown>, payloadKey: string) {
  const keys = SHEET_FIELD_KEYS[payloadKey] || [payloadKey];
  const foundKey = keys.find((key) => Object.prototype.hasOwnProperty.call(row, key));
  return foundKey ? row[foundKey] : undefined;
}

function normalizeSheetValue(value: unknown) {
  return String(value ?? "").trim();
}

function valuesMatch(sheetValue: unknown, payloadValue: unknown) {
  const sheetText = normalizeSheetValue(sheetValue);
  const payloadText = normalizeSheetValue(payloadValue);
  if (sheetText === payloadText) return true;

  const sheetNumber = Number(sheetText);
  const payloadNumber = Number(payloadText);
  return (
    sheetText !== "" &&
    payloadText !== "" &&
    Number.isFinite(sheetNumber) &&
    Number.isFinite(payloadNumber) &&
    Math.abs(sheetNumber - payloadNumber) < 0.000001
  );
}

export async function confirmGoogleAppsScriptWrite(
  scriptUrl: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const fid = payload.fid;
  if (fid == null || fid === "") return false;

  const resp = await fetch(scriptUrl, {
    method: "GET",
    cache: "no-store",
  });
  if (!resp.ok) return false;

  const rows = await resp.json();
  if (!Array.isArray(rows)) return false;

  const row = rows.find((candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    return valuesMatch(getSheetValue(candidate as Record<string, unknown>, "fid"), fid);
  }) as Record<string, unknown> | undefined;
  if (!row) return false;

  if (payload.action === "addLot") {
    return true;
  }

  return ["nombre", "estado", "precio", "area", "etapa", "coordenadas", "media"]
    .filter((key) => payload[key] != null)
    .every((key) => valuesMatch(getSheetValue(row, key), payload[key]));
}
