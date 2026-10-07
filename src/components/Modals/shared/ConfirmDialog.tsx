import { useEffect } from "react";
import "./ConfirmDialog.css";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
  isLoading?: boolean;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  icon = "warning",
  isLoading = false,
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-dialog-overlay"
      role="presentation"
      onMouseDown={() => {
        if (!isLoading) onCancel();
      }}
    >
      <section
        className={`confirm-dialog-panel ${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog-icon" aria-hidden="true">
          <span className="material-symbols-outlined">
            {isLoading ? "hourglass_top" : icon}
          </span>
        </div>
        <div className="confirm-dialog-content">
          <p className="confirm-dialog-kicker">Confirmación requerida</p>
          <h2 id="confirm-dialog-title">{title}</h2>
          <p id="confirm-dialog-message">{message}</p>
        </div>
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-btn ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-dialog-btn primary ${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {isLoading ? "hourglass_top" : "delete"}
            </span>
            <span>{isLoading ? "Procesando" : confirmLabel}</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmDialog;
