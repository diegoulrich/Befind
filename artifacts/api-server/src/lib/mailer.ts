import nodemailer from "nodemailer";

import { logger } from "./logger";

const CONTACT_RECIPIENT = "befind.business@gmail.com";

interface ContactEmailInput {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendContactEmail(input: ContactEmailInput): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn(
      { hasHost: !!process.env.SMTP_HOST, hasUser: !!process.env.SMTP_USER, hasPass: !!process.env.SMTP_PASS },
      "SMTP is not configured; contact message saved but email not sent",
    );
    return false;
  }

  const fullName = `${input.firstName} ${input.lastName}`.trim();

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: CONTACT_RECIPIENT,
    replyTo: input.email,
    subject: `Nouveau message Befind - ${fullName}`,
    text: [
      "Nouveau message depuis le formulaire Contactez-nous de Befind.",
      "",
      `Nom: ${fullName}`,
      `Email: ${input.email}`,
      "",
      "Message:",
      input.message,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Nouveau message Befind</h2>
        <p><strong>Nom:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(input.message)}</p>
      </div>
    `,
  });

  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
