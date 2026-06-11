import { useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const nextHistory: ChatMessage[] = [...history, { role: "user", content: trimmed }];
    setHistory(nextHistory);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setHistory([...nextHistory, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            assistantContent += data.content;
            setHistory([...nextHistory, { role: "assistant", content: assistantContent }]);
          }
        }
      }
    } catch {
      setHistory([...nextHistory, { role: "assistant", content: "Une erreur est survenue. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {open && (
        <Card className="mb-3 flex h-[460px] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2 font-bold">
              <Bot className="h-5 w-5 text-primary" /> Coach Befind
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {history.length === 0 && (
              <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                Posez une question sur votre idée business, votre plan d'action ou votre lancement.
              </p>
            )}
            {history.map((item, index) => (
              <div
                key={index}
                className={`rounded-xl p-3 text-sm ${
                  item.role === "user"
                    ? "ml-8 bg-primary text-primary-foreground"
                    : "mr-8 bg-muted text-foreground"
                }`}
              >
                {item.content || "..."}
              </div>
            ))}
          </div>
          <form className="flex gap-2 border-t p-3" onSubmit={sendMessage}>
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Votre question..."
              className="bg-white"
            />
            <Button size="icon" disabled={loading || !message.trim()} type="submit">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}
      <Button className="h-14 w-14 rounded-full shadow-xl" size="icon" onClick={() => setOpen((value) => !value)}>
        <Bot className="h-6 w-6" />
      </Button>
    </div>
  );
}
