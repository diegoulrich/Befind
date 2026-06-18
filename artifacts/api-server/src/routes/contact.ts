import { Router, type IRouter } from "express";
import { contactMessagesTable, db } from "@workspace/db";
import { z } from "zod/v4";

import { sendContactEmail } from "../lib/mailer";

const router: IRouter = Router();

const contactBodySchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis").max(80),
  lastName: z.string().trim().min(1, "Le nom est requis").max(80),
  email: z.string().trim().email("Adresse e-mail invalide").max(160),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(4000),
});

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = contactBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [saved] = await db
      .insert(contactMessagesTable)
      .values({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email.toLowerCase(),
        message: parsed.data.message,
      })
      .returning();

    let emailSent = false;
    try {
      emailSent = await sendContactEmail(parsed.data);
    } catch (err) {
      req.log.error({ err }, "Failed to send contact email");
    }

    res.status(201).json({ id: saved.id, status: saved.status, emailSent });
  } catch (err) {
    req.log.error({ err }, "Contact form error");
    res.status(500).json({ error: "Erreur lors de l'envoi du message" });
  }
});

export default router;
