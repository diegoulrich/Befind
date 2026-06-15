import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const AUTH_SECRET =
  process.env.AUTH_TOKEN_SECRET ?? process.env.SESSION_SECRET ?? "befind-development-auth-secret";

export interface AuthTokenPayload {
  userId: number;
  email: string;
  exp: number;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", AUTH_SECRET).update(value).digest("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [method, salt, hash] = storedHash.split(":");
  if (method !== "scrypt" || !salt || !hash) return false;

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "base64url");

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function createAuthToken(user: { id: number; email: string }): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || sign(encodedPayload) !== signature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthTokenPayload;
    if (!payload.userId || !payload.email || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(authorization?: string): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim() || null;
}

export function getAuthPayloadFromRequest(req: Request): AuthTokenPayload | null {
  const token = getBearerToken(req.headers.authorization);
  return token ? verifyAuthToken(token) : null;
}
