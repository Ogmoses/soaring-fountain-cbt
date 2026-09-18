import nodemailer from "nodemailer";

/**
 * Server-only SMTP mailer. Never import this from a "use client" component.
 *
 * Deliberately generic SMTP rather than a provider-specific SDK (e.g. the
 * SendGrid SDK) — SMTP credentials work the same way across SendGrid,
 * Resend, Postmark, Mailgun, or a school's own mail server, so swapping
 * providers later is an env var change, not a code change.
 *
 * Required env vars (Vercel → Project Settings → Environment Variables):
 *   SMTP_HOST        e.g. smtp.sendgrid.net
 *   SMTP_PORT        e.g. 587
 *   SMTP_USER        for SendGrid this is literally the string "apikey"
 *   SMTP_PASS        for SendGrid this is your SendGrid API key
 *   SMTP_FROM_EMAIL  the verified "from" address (SendGrid requires this
 *                    address, or its domain, to be a verified sender)
 *   SMTP_FROM_NAME   optional, defaults to the school name passed in
 */

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP isn't configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in your environment variables."
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587/25 use STARTTLS instead
    auth: { user, pass },
  });
  return cachedTransporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string; fromName?: string }) {
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("SMTP_FROM_EMAIL isn't set. Add it in your environment variables.");
  }
  const fromName = opts.fromName || process.env.SMTP_FROM_NAME || "School CBT Platform";

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
