import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", title, message, duration = 4000 }) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast = { id, type, title, message };

      setToasts((prev) => [...prev, newToast]);

      if (duration && type !== "loading") {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (message, title = "Success") => addToast({ type: "success", title, message }),
    error: (message, title = "Error") => addToast({ type: "error", title, message, duration: 6000 }),
    info: (message, title = "Information") => addToast({ type: "info", title, message }),
    loading: (message, title = "Processing") => addToast({ type: "loading", title, message, duration: 0 }),
    dismiss: (id) => removeToast(id),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.94 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-pure-white border border-warm-grey shadow-lg text-charcoal"
            >
              <div className="mt-0.5 shrink-0">
                {item.type === "success" && <CheckCircle2 className="w-5 h-5 text-amber-brand" />}
                {item.type === "error" && <AlertCircle className="w-5 h-5 text-red-600" />}
                {item.type === "info" && <Info className="w-5 h-5 text-amber-soft" />}
                {item.type === "loading" && <Loader2 className="w-5 h-5 text-amber-brand animate-spin" />}
              </div>

              <div className="flex-1 min-w-0">
                {item.title && <h5 className="text-xs font-semibold uppercase tracking-wider text-charcoal">{item.title}</h5>}
                <p className="text-sm text-stone-grey mt-0.5 leading-snug">{item.message}</p>
              </div>

              <button
                onClick={() => removeToast(item.id)}
                className="shrink-0 p-1 text-stone-grey hover:text-charcoal rounded-lg hover:bg-warm-ivory transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
