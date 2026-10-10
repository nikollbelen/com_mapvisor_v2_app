import { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete?: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  const [loadingMessage, setLoadingMessage] = useState("Inicializando Tupu...");

  useEffect(() => {
    // Rotar mensajes de UX cada 2 segundos
    const messages = [
      "Cargando lotes disponibles...",
      "Preparando el mapa interactivo...",
      "Organizando la informacion inmobiliaria...",
      "Activando tu experiencia 3D..."
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      setLoadingMessage(messages[msgIndex]);
      msgIndex = (msgIndex + 1) % messages.length;
    }, 2000);

    let isDone = false;
    const finishLoading = () => {
      if (isDone) return;
      isDone = true;
      setIsFading(true);
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 800);
    };

    // Escuchar cuando Cesium termina de cargar y procesar datos de Google Sheets
    window.addEventListener('cesiumReady', finishLoading);

    const handleSheetsRetry = (event: Event) => {
      const detail = (event as CustomEvent<{ attempt?: number }>).detail;
      const attempt = detail?.attempt ? ` (${detail.attempt})` : "";
      setLoadingMessage(`Reintentando cargar lotes${attempt}...`);
    };
    window.addEventListener('sheetsLoadingRetry', handleSheetsRetry as EventListener);

    return () => {
      clearInterval(msgInterval);
      window.removeEventListener('cesiumReady', finishLoading);
      window.removeEventListener('sheetsLoadingRetry', handleSheetsRetry as EventListener);
    };
  }, [onComplete]);

  // No renderizar si no es visible
  if (!isVisible) return null;

  return (
    <div 
      className={`splash-screen ${isFading ? 'fade-out' : ''}`}
      id="splash-screen"
    >
      {/* Background Layers */}
      <div className="splash-background">
        <div className="splash-overlay"></div>
        <div className="noise-texture"></div>
      </div>

      {/* HORIZONTAL DESIGN (Desktop/Landscape) */}
      <div className="splash-content-wrapper horizontal-only">
        <div className="branding">
          <img className="splash-brand-logo" src="/marca/icono-slogan.png" alt="Tupu - Encuentra tu lugar" />
        </div>

        <div className="loading-indicator">
          <div className="spinner-container">
            <div className="spinner-track"></div>
            <div className="spinner-thumb"></div>
          </div>
          <div className="progress-line">
            <div className="loading-bar-fill"></div>
          </div>
          <span className="loading-text">{loadingMessage}</span>
        </div>
      </div>

      {/* VERTICAL DESIGN (Mobile/Portrait) */}
      <div className="splash-main-vertical vertical-only">
        <div className="top-content">
          <img className="splash-brand-logo-v" src="/marca/icono-slogan.png" alt="Tupu - Encuentra tu lugar" />
        </div>

        <div className="center-element">
          <div className="center-blur"></div>
          <div className="center-ring"></div>
          <span className="splash-center-logo" aria-hidden="true" />
        </div>

        <div className="bottom-content">
          <div className="progress-bar-v">
            <div className="progress-bar-fill-v"></div>
          </div>
          <span className="loading-text-v">{loadingMessage.toUpperCase()}</span>
        </div>
      </div>

      {/* UI Overlay (Horizontal) */}
      <div className="ui-overlay horizontal-only">
        <span className="material-symbols-outlined text-gold text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>travel_explore</span>
        <span className="material-symbols-outlined text-gold text-[16px]">vrpano</span>
        <span className="material-symbols-outlined text-gold text-[16px]">location_on</span>
      </div>
    </div>
  );
};

export default SplashScreen;
