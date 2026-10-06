// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SHEET_NAME = "Hoja 1";

// Encabezados esperados (fila 1). El POST rellena por nombre, no por posición.
// FID | Número | Estado | Precio | Área (m²) | Etapa | Manzana | Lote | Coordenadas | Media | Imagenes | Videos | YouTube
const REQUIRED_HEADERS = [
  "FID",
  "Número",
  "Estado",
  "Precio",
  "Área (m²)",
  "Etapa",
  "Manzana",
  "Lote",
  "Coordenadas",
  "Media",
  "Imagenes",
  "Videos",
  "YouTube",
];

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return jsonResponse([]);
    }

    const headers = data[0].map(String);
    const rows = data.slice(1);

    const result = rows
      .filter((row) => row.some((cell) => cell !== "" && cell != null))
      .map((row) => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] ?? "";
        });
        return obj;
      });

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse([]);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: "Cuerpo POST vacío" });
    }

    const body = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const headers = ensureHeaders(sheet);
    const action = body.action || "";

    if (action === "deleteLot") {
      return deleteLot(sheet, headers, body);
    }

    if (action === "updateLot") {
      return updateLot(sheet, headers, body);
    }

    if (action !== "addLot") {
      return jsonResponse({
        ok: false,
        error: "Acción no reconocida: " + action,
      });
    }

    const newRow = headers.map((header) => {
      return valueForHeader(header, body);
    });

    sheet.appendRow(newRow);

    return jsonResponse({ ok: true, message: "Lote agregado correctamente" });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function ensureHeaders(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const normalized = currentHeaders.map((h) => h.trim());
  const missing = REQUIRED_HEADERS.filter((header) => normalized.indexOf(header) === -1);

  if (missing.length > 0) {
    sheet.getRange(1, currentHeaders.length + 1, 1, missing.length).setValues([missing]);
  }

  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(String);
}

function valueForHeader(header, body) {
  const h = String(header).trim();
  const media = parseMediaItems(body.media);
  switch (h) {
    case "FID":
    case "fid":
      return body.fid ?? "";
    case "Número":
    case "Numero":
    case "nombre":
    case "Nombre":
      return body.nombre ?? "";
    case "Estado":
    case "estado":
      return body.estado || "disponible";
    case "Precio":
    case "precio":
      return body.precio ?? "";
    case "Área (m²)":
    case "Area (m²)":
    case "Area":
    case "area":
      return body.area ?? "";
    case "Etapa":
    case "etapa":
      return body.etapa ?? "";
    case "Manzana":
      return body.manzana ?? "";
    case "Lote":
      return body.lote ?? "";
    case "Coordenadas":
    case "coordenadas":
      return body.coordenadas ?? "";
    case "Media":
    case "media":
      return body.media ?? "";
    case "Imagenes":
    case "Imágenes":
    case "imagenes":
    case "imágenes":
      return media
        .filter((item) => item.type === "image")
        .map((item) => item.url)
        .join("\n");
    case "Videos":
    case "videos":
      return media
        .filter((item) => item.type === "video")
        .map((item) => item.url)
        .join("\n");
    case "YouTube":
    case "youtube":
    case "Youtube":
      return media
        .filter((item) => item.type === "youtube")
        .map((item) => item.url)
        .join("\n");
    default:
      return "";
  }
}

function parseMediaItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function findRowByFid(sheet, headers, fid) {
  const fidIndex = headers.findIndex((h) => {
    const value = String(h).trim();
    return value === "FID" || value === "fid";
  });
  if (fidIndex < 0) return -1;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(2, fidIndex + 1, lastRow - 1, 1).getValues();
  const fidKey = String(fid);
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === fidKey) return i + 2;
  }
  return -1;
}

function updateLot(sheet, headers, body) {
  if (body.fid == null || body.fid === "") {
    return jsonResponse({ ok: false, error: "FID requerido para editar" });
  }

  const rowNumber = findRowByFid(sheet, headers, body.fid);
  if (rowNumber < 0) {
    return jsonResponse({ ok: false, error: "No se encontró el lote con FID " + body.fid });
  }

  const currentRow = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const nextRow = headers.map((header, index) => {
    const h = String(header).trim();
    if ((h === "Coordenadas" || h === "coordenadas") && body.coordenadas == null) {
      return currentRow[index];
    }
    return valueForHeader(header, body);
  });

  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([nextRow]);
  return jsonResponse({ ok: true, message: "Lote actualizado correctamente" });
}

function deleteLot(sheet, headers, body) {
  if (body.fid == null || body.fid === "") {
    return jsonResponse({ ok: false, error: "FID requerido para eliminar" });
  }

  const rowNumber = findRowByFid(sheet, headers, body.fid);
  if (rowNumber < 0) {
    return jsonResponse({ ok: false, error: "No se encontró el lote con FID " + body.fid });
  }

  sheet.deleteRow(rowNumber);
  return jsonResponse({ ok: true, message: "Lote eliminado correctamente" });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
