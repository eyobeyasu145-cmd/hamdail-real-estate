import nodemailer from "nodemailer";

let transporter;

function createTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM?.trim();
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_HOST, SMTP_PORT, and EMAIL_FROM must be configured.");
  }
  if (Boolean(user) !== Boolean(password)) {
    throw new Error("Configure both SMTP_USER and SMTP_PASSWORD, or neither.");
  }

  return {
    client: nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      ...(user ? { auth: { user, pass: password } } : {}),
    }),
    from,
  };
}

export async function sendAuthCodeEmail({ email, code, purpose }) {
  if (!transporter) transporter = createTransporter();

  const isVerification = purpose === "email_verification";
  const action = isVerification ? "verify your email address" : "reset your password";
  await transporter.client.sendMail({
    from: transporter.from,
    to: email,
    subject: isVerification
      ? "Verify your Hamdail Real Estate email"
      : "Your Hamdail Real Estate password reset code",
    text: [
      `Use this code to ${action}: ${code}`,
      "",
      "This code expires in 10 minutes and can only be used once.",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });
}
