const logger = require("../config/logger");

const DEFAULT_FROM = process.env.NOTIFICATION_FROM || "CivicDesk";

function isDevelopment() {
  return process.env.NODE_ENV !== "production";
}

function sendMockSms(to, body) {
  const message = `[MOCK SMS] To: ${to}\n${body}`;
  logger.info(message);
  return Promise.resolve({ sid: "mock-sid", status: "queued", mock: true });
}

async function sendSms(to, body) {
  let Twilio;
  try {
    Twilio = require("twilio");
  } catch (err) {
    if (isDevelopment()) {
      return sendMockSms(to, body);
    }
    throw new Error("twilio is not installed");
  }

  const hasTwilioConfig =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM;

  if (!hasTwilioConfig) {
    if (isDevelopment()) {
      return sendMockSms(to, body);
    }
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
  if (!user.phoneNumber) {
    throw new Error("User has no phone number.");
  }

  const message = `Your CivicDesk password reset code: ${token}. This code expires in 1 hour.`;

  try {
    return await sendSms(user.phoneNumber, message);
  } catch (err) {
    logger.error("Failed sending password reset SMS", {
      err: err.message,
      phoneNumber: user.phoneNumber,
    });
    throw err;
  }
}

module.exports = {
  sendPasswordReset,
  sendSms,
  sendMockSms,
};