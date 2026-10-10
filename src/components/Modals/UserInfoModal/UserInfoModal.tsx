import "./UserInfoModal.css";

interface UserInfoModalProps {
  isVisible: boolean;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  onClose: () => void;
  onLogout: () => void;
}

const UserInfoModal = ({ isVisible, user, onClose, onLogout }: UserInfoModalProps) => {
  if (!isVisible) return null;

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="user-info-modal-overlay">
      <div className="user-info-modal hud-glass-panel hud-gold-edge">
        <button
          type="button"
          className="user-info-modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="user-info-hero">
          <div className="user-info-avatar">
            <span className="material-symbols-outlined">person</span>
          </div>
          <h2 className="user-info-title">{user.full_name}</h2>
          <p className="user-info-subtitle">{user.email}</p>
          <span className="user-info-role-badge">
            Usuario
          </span>
        </div>

        <div className="user-info-modal-content">
          <div className="user-info-details">
            <div className="user-info-field">
              <span className="user-info-field-label">Nombre</span>
              <span className="user-info-field-value">{user.full_name}</span>
            </div>
            <div className="user-info-field">
              <span className="user-info-field-label">Correo</span>
              <span className="user-info-field-value">{user.email}</span>
            </div>
          </div>

          <div className="user-info-actions">
            <button type="button" className="user-info-btn-logout" onClick={handleLogout}>
              <span className="material-symbols-outlined">logout</span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
