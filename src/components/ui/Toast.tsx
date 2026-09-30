import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ToastContextType {
  notify: (tone: ToastTone, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (tone: ToastTone, title: string, message?: string) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev.slice(-3), { id, tone, title, message }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite">
        {items.map((item) => {
          const Icon = ICONS[item.tone];
          return (
            <div key={item.id} className={`toast toast--${item.tone}`}>
              <Icon size={18} className="toast__icon" />
              <div className="toast__body">
                <div className="toast__title">{item.title}</div>
                {item.message && <div className="toast__message">{item.message}</div>}
              </div>
              <button type="button" className="toast__close" onClick={() => dismiss(item.id)} aria-label="Yopish">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
