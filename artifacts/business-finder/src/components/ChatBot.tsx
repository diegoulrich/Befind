import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const message = input.trim();
    if (!message || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content: message }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: messages }),
      });

      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            assistant += data.content;
            setMessages([...nextMessages, { role: "assistant", content: assistant }]);
          }
        }
      }
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Désolé, je n'arrive pas à répondre pour le moment." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full shadow-xl"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le chatbot"
      >
        <MessageCircle />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-indigo-600 p-4 text-white">
        <div>
          <p className="font-bold">Coach Befind IA</p>
          <p className="text-xs text-white/80">Conseils business rapides</p>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="rounded-xl bg-stone-100 p-3 text-sm text-stone-600">
            Pose-moi une question sur ton idée business, ton positionnement ou tes prochaines actions.
          </p>
        )}
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-3 text-sm ${
              message.role === "user" ? "ml-8 bg-indigo-600 text-white" : "mr-8 bg-stone-100 text-stone-800"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Votre question..." />
        <Button type="submit" size="icon" disabled={loading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
