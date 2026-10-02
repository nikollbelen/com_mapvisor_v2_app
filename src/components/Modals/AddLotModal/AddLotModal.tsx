import { useState, useCallback } from "react";
import { postToGoogleAppsScript } from "../../../utils/googleAppsScript";
import "./AddLotModal.css";

interface AddLotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Tipos internos ──────────────────────────────────────────────────────────
interface ParsedCoord {
  lng: number;
  lat: number;
}

interface FormState {
  nombre: string;
  estado: string;
  precio: string;
  area: string;
  etapa: string;
  coordenadas: string;
}

// ── Parser de coordenadas ───────────────────────────────────────────────────
function parseCoordinates(raw: string): ParsedCoord[] | null {
  const lines = raw
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 3) return null;

  const coords: ParsedCoord[] = [];
  for (const line of lines) {
    // Acepta: "lng, lat" o "lng lat" con decimales negativos
    const match = line.match(
      /^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/
    );
    if (!match) return null;
    coords.push({ lng: parseFloat(match[1]), lat: parseFloat(match[2]) });
  }

  // Cerrar polígono automáticamente si la primera ≠ última
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first.lng !== last.lng || first.lat !== last.lat) {
    coords.push({ ...first });
  }

  return coords;
}

// ── Construir Feature GeoJSON ───────────────────────────────────────────────
function buildGeoJsonFeature(form: FormState, coords: ParsedCoord[], fid: number) {
  return {
    type: "Feature",
    properties: {
      fid,
      number: form.nombre.trim(),
      estado: form.estado,
      lote: form.nombre.trim(),
      manzana: "",
      area: form.area.trim(),
      precio: form.precio.trim(),
      etapa: form.etapa.trim(),
    },
    geometry: {
      type: "Polygon",
      coordinates: [coords.map((c) => [c.lng, c.lat])],
    },
  };
}

// ── Componente ──────────────────────────────────────────────────────────────
const EMPTY_FORM: FormState = {
  nombre: "",
  estado: "disponible",
  precio: "",
  area: "",
  etapa: "",
  coordenadas: "",
};

const AddLotModal = ({ isOpen, onClose }: AddLotModalProps) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [coordError, setCoordError] = useState<string>("");
  const [submitState, setSubmitState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Parsear en tiempo real para mostrar preview
  const parsedCoords = useCallback((): ParsedCoord[] | null => {
    if (!form.coordenadas.trim()) return null;
    return parseCoordinates(form.coordenadas);
  }, [form.coordenadas]);

  const coordPreview = parsedCoords();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "coordenadas") setCoordError("");
    setSubmitState("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("idle");
    setErrorMessage("");

    // Validaciones
    if (!form.nombre.trim()) {
      setErrorMessage("El nombre del lote es obligatorio.");
      setSubmitState("error");
      return;
    }

    const coords = parseCoordinates(form.coordenadas);
    if (!coords) {
      setCoordError(
        "Formato inválido. Cada línea debe tener: longitud, latitud (ej: -71.893, -17.117). Mínimo 3 puntos."
      );
      setSubmitState("error");
      return;
    }

    // Generar un FID temporal (timestamp)
    const tempFid = Date.now();
    const feature = buildGeoJsonFeature(form, coords, tempFid);

    // 1) Añadir al mapa en tiempo real vía Cesium
    try {
      if (window.addLotToMap) {
        window.addLotToMap(feature);
      }
    } catch (mapErr) {
      console.warn("[AddLotModal] No se pudo añadir al mapa:", mapErr);
    }

    // 2) Enviar a Google Apps Script (Sheet)
    const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    if (scriptUrl) {
      setSubmitState("loading");
      try {
        const payload = {
          action: "addLot",
          fid: tempFid,
          nombre: form.nombre.trim(),
          estado: form.estado,
          precio: form.precio.trim(),
          area: form.area.trim(),
          etapa: form.etapa.trim(),
          coordenadas: coords.map((c) => `${c.lng},${c.lat}`).join("|"),
        };

        const resp = await postToGoogleAppsScript(scriptUrl, payload);

        if (!resp.ok) {
          throw new Error(`Error HTTP ${resp.status}`);
        }

        let result: { ok?: boolean; error?: string } = {};
        try {
          result = await resp.json();
        } catch {
          /* respuesta vacía tras redirect de GAS */
        }
        if (result.ok === false) {
          throw new Error(result.error || "Error al guardar en Sheets");
        }

        setSubmitState("success");
        // Limpiar el formulario después del éxito
        setTimeout(() => {
          setForm(EMPTY_FORM);
          setSubmitState("idle");
          onClose();
        }, 1500);
      } catch (err) {
        console.error("[AddLotModal] Error al guardar en Sheets:", err);
        // El lote ya fue añadido al mapa; avisar que el Sheet falló
        setSubmitState("error");
        setErrorMessage(
          "El lote se agregó al mapa, pero no se pudo guardar en Google Sheets. Configura el Apps Script para aceptar POST."
        );
      }
    } else {
      // Sin URL de Script, solo agregar al mapa y cerrar
      setSubmitState("success");
      setTimeout(() => {
        setForm(EMPTY_FORM);
        setSubmitState("idle");
        onClose();
      }, 1000);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setCoordError("");
    setSubmitState("idle");
    setErrorMessage("");
    onClose();
  };

  if (!isOpen) return null;

  const isLoading = submitState === "loading";

  return (
    <div className="add-lot-overlay" onClick={handleClose}>
      <div
        className="add-lot-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Agregar nuevo lote"
      >
        {/* ── Header ── */}
        <div className="add-lot-header">
          <div className="add-lot-header-icon">
            <span className="material-symbols-outlined">add_location_alt</span>
          </div>
          <div className="add-lot-header-text">
            <h2 className="add-lot-title">Agregar lote</h2>
            <p className="add-lot-subtitle">Registra un nuevo lote en el mapa</p>
          </div>
          <button
            type="button"
            className="add-lot-close"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── Body ── */}
        <form className="add-lot-form" onSubmit={handleSubmit} noValidate>
          <div className="add-lot-body">

            {/* Información general */}
            <p className="add-lot-section-label">Información del lote</p>

            <div className="add-lot-row">
              {/* Nombre */}
              <div className="add-lot-field full">
                <label className="add-lot-label" htmlFor="al-nombre">
                  Nombre del lote *
                </label>
                <input
                  id="al-nombre"
                  name="nombre"
                  type="text"
                  className="add-lot-input"
                  placeholder='Ej: Villa 12, Jardín A, Parcela Norte…'
                  value={form.nombre}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* Estado */}
              <div className="add-lot-field">
                <label className="add-lot-label" htmlFor="al-estado">
                  Estado
                </label>
                <select
                  id="al-estado"
                  name="estado"
                  className="add-lot-select"
                  value={form.estado}
                  onChange={handleChange}
                >
                  <option value="disponible">Disponible</option>
                  <option value="reservado">Reservado</option>
                  <option value="negociacion">Negociación</option>
                  <option value="vendido">Vendido</option>
                </select>
              </div>

              {/* Etapa */}
              <div className="add-lot-field">
                <label className="add-lot-label" htmlFor="al-etapa">
                  Etapa / Fase
                </label>
                <input
                  id="al-etapa"
                  name="etapa"
                  type="text"
                  className="add-lot-input"
                  placeholder='Ej: 1, II, A…'
                  value={form.etapa}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* Precio */}
              <div className="add-lot-field">
                <label className="add-lot-label" htmlFor="al-precio">
                  Precio (USD)
                </label>
                <input
                  id="al-precio"
                  name="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  className="add-lot-input"
                  placeholder='45300'
                  value={form.precio}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* Área */}
              <div className="add-lot-field">
                <label className="add-lot-label" htmlFor="al-area">
                  Área (m²)
                </label>
                <input
                  id="al-area"
                  name="area"
                  type="number"
                  min="0"
                  step="0.01"
                  className="add-lot-input"
                  placeholder='188.71'
                  value={form.area}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="add-lot-divider" />

            {/* Coordenadas */}
            <p className="add-lot-section-label">Vértices del polígono</p>

            <div className="add-lot-field full">
              <label className="add-lot-label" htmlFor="al-coords">
                Coordenadas — una por línea <em>(longitud, latitud)</em>
              </label>
              <textarea
                id="al-coords"
                name="coordenadas"
                className="add-lot-textarea"
                placeholder={`-71.893841942111905, -17.117220623098316\n-71.893151530107019, -17.116378663599498\n-71.892799975913476, -17.116612391090218\n-71.893529093394108, -17.117499940288173`}
                value={form.coordenadas}
                onChange={handleChange}
                spellCheck={false}
              />
              <p className="add-lot-coords-hint">
                Pega pares <code>longitud, latitud</code> separados por saltos de línea.
                Mínimo 3 puntos. El polígono se cierra automáticamente.
              </p>
              {coordError && (
                <p className="add-lot-field-error">{coordError}</p>
              )}
            </div>

            {/* Preview de coordenadas */}
            {coordPreview && !coordError && (
              <div className="add-lot-coords-preview">
                <strong>{coordPreview.length - 1}</strong> vértices detectados
                · El polígono se cerrará automáticamente ✓
              </div>
            )}

            {/* Mensajes de estado */}
            {submitState === "success" && (
              <div className="add-lot-status success">
                <span className="material-symbols-outlined">check_circle</span>
                Lote agregado correctamente
              </div>
            )}
            {submitState === "error" && errorMessage && (
              <div className="add-lot-status error">
                <span className="material-symbols-outlined">error</span>
                {errorMessage}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="add-lot-footer">
            <button
              type="button"
              className="add-lot-btn-cancel"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="add-lot-btn-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined">hourglass_top</span>
                  Guardando…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">add_location_alt</span>
                  Agregar lote
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLotModal;
