import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; type: ToastType; message: string; }

let pushFn: ((type: ToastType, message: string) => void) | null = null;
export const toast = {
  success: (m: string) => pushFn?.("success", m),
  error: (m: string) => pushFn?.("error", m),
  info: (m: string) => pushFn?.("info", m),
};

const config: Record<ToastType, { icon: typeof Info; classes: string }> = {
  success: { icon: CheckCircle2, classes: "bg-success-50 border-success-200 text-success-800" },
  error: { icon: AlertCircle, classes: "bg-error-50 border-error-200 text-error-800" },
  info: { icon: Info, classes: "bg-primary-50 border-primary-200 text-primary-800" },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    pushFn = (type, message) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    };
    return () => { pushFn = null; };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const { icon: Icon, classes } = config[t.type];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-card-hover animate-slide-up pointer-events-auto ${classes}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-current opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm animate-fade-in">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-neutral-500 dark:text-neutral-400">
      <div className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-primary-600 rounded-full animate-spin" />
      {label && <span className="ml-3 text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{title}</h3>
      {description && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
