import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ToastOptions } from "@/hooks/use-toast";

interface ToastState extends ToastOptions {
  id: number;
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastOptions>).detail;
      const id = Date.now();
      setToasts((prev) => [...prev.slice(-2), { id, ...detail }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3500);
    };

    window.addEventListener("befind-toast", handler);
    return () => window.removeEventListener("befind-toast", handler);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-xl border bg-card p-4 shadow-xl",
            toast.variant === "destructive" && "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {toast.title && <p className="font-bold">{toast.title}</p>}
          {toast.description && <p className="text-sm opacity-80">{toast.description}</p>}
        </div>
      ))}
    </div>
  );
}
