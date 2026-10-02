// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SHEET_NAME = "Hoja 1";

// Encabezados esperados (fila 1). El POST rellena por nombre, no por posición.
// FID | Número | Estado | Precio | Área (m²) | Etapa | Manzana | Lote | Coordenadas

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
    if ((body.action || "") !== "addLot") {
      return jsonResponse({
        ok: false,
        error: "Acción no reconocida: " + (body.action || ""),
      });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const newRow = headers.map((header) => {
      const h = String(header).trim();
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
          return "";
        case "Lote":
          return "";
        case "Coordenadas":
        case "coordenadas":
          return body.coordenadas ?? "";
        default:
          return "";
      }
    });

    sheet.appendRow(newRow);

    return jsonResponse({ ok: true, message: "Lote agregado correctamente" });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
