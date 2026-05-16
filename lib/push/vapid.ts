import "server-only";

import webPush from "web-push";

type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

let configured = false;

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required push notification environment variable: ${name}.`);
  }

  return value;
}

export function getVapidPublicKey() {
  return readRequiredEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
}

export function getVapidConfig(): VapidConfig {
  return {
    publicKey: getVapidPublicKey(),
    privateKey: readRequiredEnv("VAPID_PRIVATE_KEY"),
    subject: readRequiredEnv("VAPID_SUBJECT"),
  };
}

export function getConfiguredWebPush() {
  const config = getVapidConfig();

  if (!configured) {
    webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    configured = true;
  }

  return webPush;
}
