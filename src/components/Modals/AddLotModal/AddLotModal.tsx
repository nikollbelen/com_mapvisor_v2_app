import { useState, useCallback, useEffect } from "react";
import { postToGoogleAppsScript } from "../../../utils/googleAppsScript";
import "./AddLotModal.css";

interface AddLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  initialLot?: any;
  onSaved?: () => void;
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
  youtubeUrl: string;
}

interface LotMediaItem {
  type: "image" | "video" | "youtube";
  url: string;
  key?: string;
  name?: string;
}

const MAX_IMAGE_FILES = 10;
const MAX_VIDEO_FILES = 3;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 80;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

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
function buildGeoJsonFeature(form: FormState, coords: ParsedCoord[], fid: number | string) {
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
      media: "",
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
  youtubeUrl: "",
};

function parseMedia(raw: unknown): LotMediaItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((item) => item?.type && item?.url);
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.type && item?.url)
      : [];
  } catch {
    return [];
  }
}

function getYoutubeEmbedUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") {
      videoId = parsed.pathname.replace("/", "");
    } else if (host.endsWith("youtube.com")) {
      videoId = parsed.searchParams.get("v") || "";
      if (!videoId && parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/")[2] || "";
      }
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
  } catch {
    return trimmed;
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIdentity(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

async function readJsonResponse(resp: Response) {
  const text = await resp.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function uploadLotFile(file: File, lotId: number | string): Promise<LotMediaItem> {
  const presignResp = await fetch("/api/r2-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      lotId,
    }),
  });
  const presign = await readJsonResponse(presignResp);
  if (!presignResp.ok || !presign?.ok) {
    if (presignResp.status === 404) {
      throw new Error(
        "No se encontró /api/r2-upload-url. En local usa `vercel dev` o prueba en el deploy de Vercel; Vite solo no levanta las funciones API."
      );
    }
    throw new Error(presign?.error || "No se pudo preparar la subida a Cloudflare R2");
  }

  const uploadResp = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
  });
  if (!uploadResp.ok) {
    throw new Error(`No se pudo subir ${file.name}`);
  }

  return {
    type: file.type.startsWith("video/") ? "video" : "image",
    url: presign.publicUrl,
    key: presign.key,
    name: file.name,
  };
}

const AddLotModal = ({
  isOpen,
  onClose,
  mode = "add",
  initialLot,
  onSaved,
}: AddLotModalProps) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [existingMedia, setExistingMedia] = useState<LotMediaItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [coordError, setCoordError] = useState<string>("");
  const [mediaError, setMediaError] = useState<string>("");
  const [submitState, setSubmitState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const isEditMode = mode === "edit" && initialLot;

  useEffect(() => {
    if (!isOpen) return;
    if (!isEditMode) {
      setForm(EMPTY_FORM);
      setExistingMedia([]);
      setSelectedFiles([]);
      setMediaError("");
      return;
    }

    const media = parseMedia(initialLot.media || initialLot.Media);
    const youtube = media.find((item) => item.type === "youtube")?.url || "";
    setForm({
      nombre: initialLot.nombre || initialLot.direccion || "",
      estado: initialLot.estado || "disponible",
      precio:
        typeof initialLot.precio === "number"
          ? String(initialLot.precio)
          : initialLot.precio || "",
      area:
        typeof initialLot.area === "number"
          ? String(initialLot.area)
          : initialLot.area || "",
      etapa: initialLot.phase || initialLot.etapa || "",
      coordenadas: "",
      youtubeUrl: youtube,
    });
    setExistingMedia(media.filter((item) => item.type !== "youtube"));
    setSelectedFiles([]);
    setMediaError("");
  }, [isOpen, isEditMode, initialLot]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(e.target.files || []);
    const currentImages =
      existingMedia.filter((item) => item.type === "image").length +
      selectedFiles.filter((file) => file.type.startsWith("image/")).length;
    const currentVideos =
      existingMedia.filter((item) => item.type === "video").length +
      selectedFiles.filter((file) => file.type.startsWith("video/")).length;
    let nextImages = currentImages;
    let nextVideos = currentVideos;
    const acceptedFiles: File[] = [];
    const rejectedMessages: string[] = [];

    incomingFiles.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        rejectedMessages.push(`${file.name}: tipo no permitido.`);
        return;
      }

      if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
        rejectedMessages.push(
          `${file.name}: pesa ${formatBytes(file.size)}; máximo ${MAX_IMAGE_SIZE_MB} MB por imagen.`
        );
        return;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
        rejectedMessages.push(
          `${file.name}: pesa ${formatBytes(file.size)}; máximo ${MAX_VIDEO_SIZE_MB} MB por video.`
        );
        return;
      }

      if (isImage && nextImages >= MAX_IMAGE_FILES) {
        rejectedMessages.push(`Máximo ${MAX_IMAGE_FILES} imágenes por lote.`);
        return;
      }

      if (isVideo && nextVideos >= MAX_VIDEO_FILES) {
        rejectedMessages.push(`Máximo ${MAX_VIDEO_FILES} videos por lote.`);
        return;
      }

      acceptedFiles.push(file);
      if (isImage) nextImages += 1;
      if (isVideo) nextVideos += 1;
    });

    setSelectedFiles((prev) => {
      const previousIds = new Set(prev.map(fileIdentity));
      const uniqueNewFiles = acceptedFiles.filter((file) => !previousIds.has(fileIdentity(file)));
      return [...prev, ...uniqueNewFiles];
    });
    setMediaError(rejectedMessages[0] || "");
    e.target.value = "";
    setSubmitState("idle");
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setSubmitState("idle");
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setMediaError("");
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

    const coords = form.coordenadas.trim() ? parseCoordinates(form.coordenadas) : null;
    if (!coords && !isEditMode) {
      setCoordError(
        "Formato inválido. Cada línea debe tener: longitud, latitud (ej: -71.893, -17.117). Mínimo 3 puntos."
      );
      setSubmitState("error");
      return;
    }

    if (form.coordenadas.trim() && !coords) {
      setCoordError(
        "Formato inválido. Cada línea debe tener: longitud, latitud (ej: -71.893, -17.117). Mínimo 3 puntos."
      );
      setSubmitState("error");
      return;
    }

    const fid = isEditMode ? initialLot.id : Date.now();

    setSubmitState("loading");
    let media: LotMediaItem[] = [...existingMedia];
    try {
      const uploadedMedia = await Promise.all(
        selectedFiles.map((file) => uploadLotFile(file, fid))
      );
      media = [...media, ...uploadedMedia];
      const youtubeEmbedUrl = getYoutubeEmbedUrl(form.youtubeUrl);
      if (youtubeEmbedUrl) {
        media.push({ type: "youtube", url: youtubeEmbedUrl });
      }
    } catch (err) {
      console.error("[AddLotModal] Error al subir multimedia:", err);
      setSubmitState("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "No se pudo subir la multimedia a Cloudflare R2. Revisa la configuración de R2 en Vercel."
      );
      return;
    }

    // Generar un FID temporal (timestamp)
    const feature = coords ? buildGeoJsonFeature(form, coords, fid) : null;
    if (feature) {
      feature.properties.media = JSON.stringify(media);
    }

    // 1) Añadir al mapa en tiempo real vía Cesium
    try {
      if (window.addLotToMap) {
        if (feature) window.addLotToMap(feature);
      }
    } catch (mapErr) {
      console.warn("[AddLotModal] No se pudo añadir al mapa:", mapErr);
    }

    // 2) Enviar a Google Apps Script (Sheet)
    const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
    if (scriptUrl) {
      try {
        const payload = {
          action: isEditMode ? "updateLot" : "addLot",
          fid,
          nombre: form.nombre.trim(),
          estado: form.estado,
          precio: form.precio.trim(),
          area: form.area.trim(),
          etapa: form.etapa.trim(),
          media: JSON.stringify(media),
          ...(coords
            ? { coordenadas: coords.map((c) => `${c.lng},${c.lat}`).join("|") }
            : {}),
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
        onSaved?.();
        // Limpiar el formulario después del éxito
        setTimeout(() => {
          setForm(EMPTY_FORM);
          setExistingMedia([]);
          setSelectedFiles([]);
          setMediaError("");
          setSubmitState("idle");
          onClose();
        }, 1500);
      } catch (err) {
        console.error("[AddLotModal] Error al guardar en Sheets:", err);
        // El lote ya fue añadido al mapa; avisar que el Sheet falló
        setSubmitState("error");
        setErrorMessage(
          "No se pudo guardar en Google Sheets. Verifica que el Apps Script actualizado esté desplegado."
        );
      }
    } else {
      // Sin URL de Script, solo agregar al mapa y cerrar
      setSubmitState("success");
      setTimeout(() => {
        setForm(EMPTY_FORM);
        setExistingMedia([]);
        setSelectedFiles([]);
        setMediaError("");
        setSubmitState("idle");
        onClose();
      }, 1000);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setExistingMedia([]);
    setSelectedFiles([]);
    setMediaError("");
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
            <h2 className="add-lot-title">
              {isEditMode ? "Editar lote" : "Agregar lote"}
            </h2>
            <p className="add-lot-subtitle">
              {isEditMode ? "Actualiza datos y multimedia" : "Registra un nuevo lote en el mapa"}
            </p>
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
                {isEditMode
                  ? "Déjalo vacío para conservar el polígono actual."
                  : "Pega pares longitud, latitud separados por saltos de línea. Mínimo 3 puntos. El polígono se cierra automáticamente."}
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

            <div className="add-lot-divider" />

            <p className="add-lot-section-label">Multimedia opcional</p>

            <div className="add-lot-field full">
              <label className="add-lot-label" htmlFor="al-media">
                Imágenes o videos
              </label>
              <input
                id="al-media"
                type="file"
                className="add-lot-file-input"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
              />
              <p className="add-lot-coords-hint">
                Puedes subir hasta {MAX_IMAGE_FILES} imágenes de {MAX_IMAGE_SIZE_MB} MB
                y {MAX_VIDEO_FILES} videos de {MAX_VIDEO_SIZE_MB} MB por lote.
              </p>
              {mediaError && <p className="add-lot-field-error">{mediaError}</p>}
            </div>

            {(existingMedia.length > 0 || selectedFiles.length > 0) && (
              <div className="add-lot-media-list">
                {existingMedia.map((item, index) => (
                  <div className="add-lot-media-chip" key={`${item.url}-${index}`}>
                    <span className="material-symbols-outlined">
                      {item.type === "video" ? "movie" : "image"}
                    </span>
                    <span>{item.name || item.url.split("/").pop()}</span>
                    <button type="button" onClick={() => removeExistingMedia(index)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}
                {selectedFiles.map((file) => (
                  <div className="add-lot-media-chip pending" key={`${file.name}-${file.size}`}>
                    <span className="material-symbols-outlined">
                      {file.type.startsWith("video/") ? "movie" : "image"}
                    </span>
                    <span>{file.name} · {formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(selectedFiles.indexOf(file))}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="add-lot-field full">
              <label className="add-lot-label" htmlFor="al-youtube">
                Enlace de YouTube
              </label>
              <input
                id="al-youtube"
                name="youtubeUrl"
                type="url"
                className="add-lot-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.youtubeUrl}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>

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
                  {isEditMode ? "Guardar cambios" : "Agregar lote"}
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
