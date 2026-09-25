import { useCallback, useRef, useState } from "react";
import { ToastContext } from "./toastContext";

let toastIdCounter = 0;
const EXIT_MS = 220;
const DEFAULT_DURATION_MS = 3500;

const TYPE_LABELS = {
  success: "Sucesso",
  error: "Erro",
  warning: "Aviso",
  info: "Informação",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = DEFAULT_DURATION_MS) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      timersRef.current[id] = setTimeout(
        () => dismiss(id),
        Math.max(0, duration)
      );
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="toast-stack" aria-live="polite" aria-label="Notificações">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item toast-${toast.type}${toast.leaving ? " leaving" : ""}`}
            role="alert"
          >
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label={`Fechar notificação de ${TYPE_LABELS[toast.type] || "informação"}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}