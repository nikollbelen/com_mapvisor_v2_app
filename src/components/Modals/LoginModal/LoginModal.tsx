import { useState } from "react";
import "./LoginModal.css";
import { useAuth } from "../../../contexts/AuthContext";

interface LoginModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
}

interface LoginCredentials {
  fullName: string;
  email: string;
  password: string;
}

const LoginModal = ({ isVisible, onClose, onAuthenticated }: LoginModalProps) => {
  const { login, register } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    fullName: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    login: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Validar email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar campo específico
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    if (field === 'fullName') {
      newErrors.fullName = value && value.trim().length < 3
        ? 'Ingrese su nombre completo'
        : '';
    } else if (field === 'email') {
      newErrors.email = value && !validateEmail(value)
        ? 'Ingrese un correo electrónico válido'
        : '';
    } else if (field === 'password') {
      newErrors.password = value && value.length < 6
        ? 'La contraseña debe tener al menos 6 caracteres'
        : '';
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores anteriores
    setErrors({ fullName: '', email: '', password: '', login: '' });
    
    // Validar campos
    const hasErrors = !!(errors.fullName || errors.email || errors.password);
    
    if (
      hasErrors ||
      (isRegisterMode && !credentials.fullName.trim()) ||
      !credentials.email ||
      !credentials.password
    ) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = isRegisterMode
        ? await register(credentials.fullName, credentials.email, credentials.password)
        : await login(credentials.email, credentials.password);
      
      if (success === true || (typeof success === "object" && success.ok)) {
        onAuthenticated?.();
        onClose();
        setCredentials({ fullName: '', email: '', password: '' });
        setIsRegisterMode(false);
      } else {
        setErrors(prev => ({ 
          ...prev, 
          login: typeof success === "object" && success.error
            ? success.error
            : 'Correo electrónico o contraseña incorrectos'
        }));
      }
    } catch (error) {
      console.error('Error en login:', error);
      setErrors(prev => ({ 
        ...prev, 
        login: 'Error al iniciar sesión. Por favor, intente nuevamente.' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  if (!isVisible) return null;

  const toggleRegisterMode = () => {
    setIsRegisterMode((prev) => !prev);
    setShowForgot(false);
    setErrors({ fullName: '', email: '', password: '', login: '' });
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <button className="login-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="login-hero">
          <div className="login-logo-container">
            <span className="login-logo-mark" aria-hidden="true" />
          </div>
          {!showForgot ? (
            <>
              <h1 className="login-title">
                {isRegisterMode ? 'Crear cuenta' : 'Inicio de sesión'}
              </h1>
              <p className="login-subtitle">
                {isRegisterMode
                  ? 'Regístrate para agregar lotes y ver tus publicaciones'
                  : 'Ingresa para gestionar tus lotes dentro del visor'}
              </p>
            </>
          ) : (
            <>
              <h1 className="login-title">Recuperar Acceso</h1>
              <p className="login-subtitle forgot-desc">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña</p>
            </>
          )}
        </div>

        <div className="login-modal-content">
          {!showForgot ? (
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                {isRegisterMode && (
                  <div className="login-field">
                    <label className="form-label" htmlFor="fullName">Nombre completo</label>
                    <input
                      id="fullName"
                      type="text"
                      className={`form-input ${errors.fullName ? 'error' : ''}`}
                      placeholder="Tu nombre"
                      value={credentials.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      disabled={isLoading}
                      autoComplete="name"
                    />
                    {errors.fullName && <div className="error-message">{errors.fullName}</div>}
                  </div>
                )}

                <div className="login-field">
                  <label className="form-label" htmlFor="email">Usuario / Email</label>
                  <input
                    id="email"
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="ejemplo@correo.com"
                    value={credentials.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>

                <div className="login-field">
                  <label className="form-label" htmlFor="password">Contraseña</label>
                  <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    disabled={isLoading}
                    autoComplete={isRegisterMode ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                  </div>
                  {errors.password && <div className="error-message">{errors.password}</div>}
                </div>
              </div>

              <div className="login-row">
                {!isRegisterMode ? (
                  <>
                    <label className="remember">
                      <input
                        type="checkbox"
                        className="remember-checkbox"
                        defaultChecked
                      />
                      Recordarme
                    </label>
                    <button type="button" className="forgot" onClick={() => setShowForgot(true)}>
                      Olvidé mi contraseña
                    </button>
                  </>
                ) : (
                  <p className="login-static-note">La cuenta se guardará localmente en este navegador.</p>
                )}
              </div>

              {errors.login && (
                <div className="login-error">
                  <span className="material-symbols-outlined">warning</span>
                  {errors.login}
                </div>
              )}

              <div className="login-actions">
                <button 
                  type="submit"
                  className="btn-submit" 
                  disabled={isLoading}
                >
                  {isLoading
                    ? (isRegisterMode ? 'CREANDO...' : 'INGRESANDO...')
                    : (isRegisterMode ? 'CREAR CUENTA' : 'INGRESAR')}
                </button>
              </div>

              <div className="login-switch">
                <span>{isRegisterMode ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}</span>
                <button type="button" className="forgot" onClick={toggleRegisterMode}>
                  {isRegisterMode ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={(e) => { e.preventDefault(); alert('Se envió un link al correo ingresado'); }}>
              <div className="input-group">
                <label className="form-label" htmlFor="recover-email">Correo Electrónico</label>
                <input
                  id="recover-email"
                  type="email"
                  className="form-input"
                  placeholder="tu@correo.com"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="login-actions">
                <button type="submit" className="btn-submit" disabled={isLoading}>
                  ENVIAR ENLACE
                </button>
              </div>

              <div className="login-row" style={{ marginTop: 16, justifyContent: 'center' }}>
                <button type="button" className="forgot" onClick={() => setShowForgot(false)}>
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
