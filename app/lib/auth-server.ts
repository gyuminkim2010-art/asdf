import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;

  const hash = scryptSync(password, salt, 64);
  const original = Buffer.from(originalHash, "hex");

  if (hash.length !== original.length) return false;
  return timingSafeEqual(hash, original);
}

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

export function createSessionValue(payload: {
  userId: number;
  role: string;
  nickname: string;
}) {
  const json = JSON.stringify(payload);
  const encoded = toBase64Url(json);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionValue(cookieValue: string | undefined) {
  if (!cookieValue) return null;

  const [encoded, signature] = cookieValue.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  if (expected !== signature) return null;

  try {
    const json = fromBase64Url(encoded).toString("utf8");
    return JSON.parse(json) as {
      userId: number;
      role: string;
      nickname: string;
    };
  } catch {
    return null;
  }
}