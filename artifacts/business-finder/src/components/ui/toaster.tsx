import { useEffect, useState } from "react";

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<Omit<ToastMessage, "id">>).detail;
      const id = Date.now();
      setMessages((prev) => [...prev, { id, ...detail }]);
      window.setTimeout(() => {
        setMessages((prev) => prev.filter((message) => message.id !== id));
      }, 4500);
    };

    window.addEventListener("befind-toast", handler);
    return () => window.removeEventListener("befind-toast", handler);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-xl border p-4 shadow-lg ${
            message.variant === "destructive"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-stone-200 bg-white text-stone-900"
          }`}
        >
          <p className="font-bold">{message.title}</p>
          {message.description && <p className="mt-1 text-sm opacity-80">{message.description}</p>}
        </div>
      ))}
    </div>
  );
}
