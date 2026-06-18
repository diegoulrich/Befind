import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import {
  createAuthToken,
  getBearerToken,
  hashPassword,
  verifyAuthToken,
  verifyPassword,
} from "../lib/auth";

const router: IRouter = Router();

const registerBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
});

const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function publicUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = registerBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) {
      res.status(409).json({ error: "email_already_used", message: "Un compte existe déjà avec cet email." });
      return;
    }

    const [user] = await db
      .insert(usersTable)
      .values({
        email,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        passwordHash: await hashPassword(parsed.data.password),
      })
      .returning();

    res.status(201).json({
      user: publicUser(user),
      token: createAuthToken(user),
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Erreur lors de la création du compte" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = loginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      res.status(401).json({ error: "invalid_credentials", message: "Email ou mot de passe incorrect." });
      return;
    }

    res.json({
      user: publicUser(user),
      token: createAuthToken(user),
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "missing_token" });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "invalid_token" });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
    if (!user) {
      res.status(401).json({ error: "invalid_token" });
      return;
    }

    res.json({ user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "Me error");
    res.status(500).json({ error: "Erreur lors du chargement du compte" });
  }
});

export default router;
