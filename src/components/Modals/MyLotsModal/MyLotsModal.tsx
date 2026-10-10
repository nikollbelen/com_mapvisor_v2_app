import type { UserLotRecord } from "../../../utils/userLots";
import "./MyLotsModal.css";

interface MyLotsModalProps {
  isVisible: boolean;
  lots: UserLotRecord[];
  onClose: () => void;
}

const formatCurrency = (value: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Sin precio";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const MyLotsModal = ({ isVisible, lots, onClose }: MyLotsModalProps) => {
  if (!isVisible) return null;

  const handleViewLot = (lot: UserLotRecord) => {
    if (window.handleLotCardClick) {
      window.handleLotCardClick(lot.id, lot.nombre);
    }
    onClose();
  };

  return (
    <div className="my-lots-modal-overlay">
      <div className="my-lots-modal hud-glass-panel hud-gold-edge">
        <button
          type="button"
          className="my-lots-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="my-lots-header">
          <div className="my-lots-header-icon">
            <span className="material-symbols-outlined">real_estate_agent</span>
          </div>
          <div>
            <h2 className="my-lots-title">Mis lotes</h2>
            <p className="my-lots-subtitle">
              {lots.length === 1
                ? "1 lote creado en este navegador"
                : `${lots.length} lotes creados en este navegador`}
            </p>
          </div>
        </div>

        <div className="my-lots-content">
          {lots.length === 0 ? (
            <div className="my-lots-empty">
              <span className="material-symbols-outlined">add_location_alt</span>
              <h3>Aún no tienes lotes</h3>
              <p>Cuando agregues un lote con tu sesión iniciada aparecerá aquí.</p>
            </div>
          ) : (
            <div className="my-lots-list">
              {lots.map((lot) => (
                <article className="my-lot-card" key={lot.id}>
                  <div className="my-lot-card-main">
                    <span className="my-lot-name">{lot.nombre}</span>
                    <span className={`my-lot-status status-${lot.estado}`}>
                      {lot.estado}
                    </span>
                  </div>
                  <div className="my-lot-meta">
                    <span>{lot.area ? `${lot.area} m²` : "Sin área"}</span>
                    <span>{formatCurrency(lot.precio)}</span>
                    {lot.etapa && <span>{lot.etapa}</span>}
                  </div>
                  <div className="my-lot-date">
                    Creado {formatDate(lot.createdAt)}
                  </div>
                  <button
                    type="button"
                    className="my-lot-view-btn"
                    onClick={() => handleViewLot(lot)}
                  >
                    Ver
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLotsModal;
