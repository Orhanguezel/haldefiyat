"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (message: string, type: ToastType) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-4), { id, message, type }]);
      const timer = setTimeout(() => dismiss(id), DURATION);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const value: ToastContextValue = {
    success: (m) => push(m, "success"),
    error:   (m) => push(m, "error"),
    info:    (m) => push(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 md:right-6"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-[13px] font-medium backdrop-blur-sm transition-all ${COLOR[t.type]}`}
            >
              <span>{ICON[t.type]}</span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

const COLOR: Record<ToastType, string> = {
  success: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  error:   "border-(--color-danger)/30 bg-(--color-danger)/10 text-(--color-danger)",
  info:    "border-(--color-brand)/30 bg-(--color-brand)/10 text-(--color-brand)",
};

const ICON: Record<ToastType, string> = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
