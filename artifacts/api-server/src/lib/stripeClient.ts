import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

import { logger } from "./logger";

async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;

  if (!hostname || !xReplitToken) {
    logger.error({ hostname: !!hostname, hasToken: !!xReplitToken }, "Missing Replit env vars for Stripe");
    throw new Error(
      "Missing Replit environment variables. Ensure the Stripe integration is connected via the Integrations tab.",
    );
  }

  const url = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`;
  logger.info({ url }, "Fetching Stripe credentials");

  const resp = await fetch(url, {
    headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
    signal: AbortSignal.timeout(10_000),
  });

  if (!resp.ok) {
    const body = await resp.text();
    logger.error({ status: resp.status, body }, "Failed to fetch Stripe credentials");
    throw new Error(`Failed to fetch Stripe credentials: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const item = data.items?.[0];
  const settings = item?.settings;
  const secretKey = settings?.secret_key ?? settings?.secret;

  logger.info(
    { settingsKeys: settings ? Object.keys(settings) : null, hasSecretKey: !!secretKey },
    "Stripe settings inspection",
  );

  if (!secretKey) {
    throw new Error(
      "Stripe integration not connected or missing secret key. Connect Stripe via the Integrations tab first.",
    );
  }

  return {
    secretKey,
    webhookSecret: settings.webhook_secret ?? settings.webhook_signing_secret,
  };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? "",
  });
}
