import { useCallback } from "react";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const message = [options.title, options.description].filter(Boolean).join("\n");
    if (message) {
      window.dispatchEvent(new CustomEvent<ToastOptions>("befind-toast", { detail: options }));
    }
  }, []);

  return { toast };
}
