import React, { useState, useContext } from 'react';
import { Calculator, X, Maximize2, Minimize2 } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import CasioFX580 from './CasioFX580';

export default function CasioFloatingWidget() {
  const { t } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {/* Floating launcher trigger button at bottom right */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="casio-floating-launcher animate-bounce"
          title={t("Mở máy tính Casio fx-580VN X", "Open Casio fx-580VN X Calculator")}
        >
          <Calculator size={22} />
          <span className="launcher-badge">fx-580</span>
        </button>
      )}

      {/* Floating Window Overlay */}
      {isOpen && (
        <div className={`casio-floating-window ${isMinimized ? 'minimized' : ''} animate-pop`}>
          <div className="floating-window-header">
            <div className="header-title">
              <Calculator size={16} color="#00e5ff" />
              <span>{t("Máy tính Casio fx-580VN X", "Casio fx-580VN X Calculator")}</span>
            </div>
            <div className="header-controls">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="header-btn"
                title={isMinimized ? t('Mở rộng', 'Expand') : t('Thu nhỏ', 'Minimize')}
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="header-btn close"
                title={t("Đóng máy tính", "Close calculator")}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="floating-window-body">
              <CasioFX580 isFloating={true} onClose={() => setIsOpen(false)} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
