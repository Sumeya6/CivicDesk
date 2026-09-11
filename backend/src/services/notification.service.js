const logger = require("../config/logger");

const DEFAULT_FROM = process.env.NOTIFICATION_FROM || "no-reply@example.com";

async function sendEmail(to, subject, text, html) {
  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch (err) {
    throw new Error("nodemailer is not installed");
  }

  const transportOptions = {};
  if (process.env.SMTP_HOST) {
    transportOptions.host = process.env.SMTP_HOST;
    transportOptions.port = process.env.SMTP_PORT || 587;
    transportOptions.secure = process.env.SMTP_SECURE === "true";
    if (process.env.SMTP_USER) {
      transportOptions.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      };
    }
  }

  const transporter = nodemailer.createTransport(transportOptions);

  const info = await transporter.sendMail({
    from: DEFAULT_FROM,
    to,
    subject,
    text,
    html,
  });

  logger.info("Sent email", { to, subject, messageId: info.messageId });
  return info;
}

async function sendSms(to, body) {
  let Twilio;
  try {
    Twilio = require("twilio");
  } catch (err) {
    throw new Error("twilio is not installed");
  }

  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM
  ) {
    throw new Error("Twilio configuration is missing.");
  }

  const client = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
  const msg = await client.messages.create({
    body,
    from: process.env.TWILIO_FROM,
    to,
  });
  logger.info("Sent SMS", { to, sid: msg.sid });
  return msg;
}

async function sendPasswordReset(user, token) {
  const method = (process.env.NOTIFICATION_METHOD || "email").toLowerCase();
  const message = `Use this token to reset your password: ${token}`;

  try {
    if (method === "sms") {
      if (!user.phoneNumber) throw new Error("User has no phone number.");
      return await sendSms(user.phoneNumber, message);
    }

    // default to email
    if (!user.email) throw new Error("User has no email.");
    const subject = "Password Reset";
    const html = `<p>${message}</p>`;
    return await sendEmail(user.email, subject, message, html);
  } catch (err) {
    logger.error("Failed sending password reset", { err: err.message });
    throw err;
  }
}

module.exports = {
  sendPasswordReset,
};
