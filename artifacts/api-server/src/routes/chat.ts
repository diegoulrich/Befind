import { Router, type IRouter } from "express";
import { openai } from "../lib/openai";

const router: IRouter = Router();

router.post("/chat", async (req, res): Promise<void> => {
  const { message, history: rawHistory } = req.body as {
    message: unknown;
    history: unknown;
  };

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const history: { role: "user" | "assistant"; content: string }[] =
    Array.isArray(rawHistory)
      ? rawHistory
          .filter(
            (m): m is { role: "user" | "assistant"; content: string } =>
              m != null &&
              typeof m === "object" &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string",
          )
          .slice(-20)
      : [];

  const systemPrompt = `Tu es un coach expert en entrepreneuriat et business pour l'application befind.
Tu aides les utilisateurs à identifier le business idéal pour leur profil, répondre à leurs questions sur la création d'entreprise, la gestion, le marketing, et les motiver à se lancer.
Sois concis (3-5 phrases max par réponse), bienveillant, direct et pratique. Donne des conseils actionnables.
Réponds toujours dans la langue utilisée par l'utilisateur.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error({ err }, "Chat error");
    res.write(`data: ${JSON.stringify({ error: true })}\n\n`);
  }

  res.end();
});

export default router;
