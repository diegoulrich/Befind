import { useCallback } from "react";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    window.dispatchEvent(new CustomEvent<ToastOptions>("befind-toast", { detail: options }));
  }, []);

  return { toast };
}
