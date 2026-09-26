import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// scrypt is built into Node's crypto module — no native dependency (like
// bcrypt) needs to be installed, and it's a memory-hard KDF suitable for
// password hashing (same category as bcrypt/argon2).
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");

  if (parts.length !== 3) return false;

  const [scheme, salt, hashHex] = parts;

  if (scheme !== "scrypt" || !salt || !hashHex) return false;

  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  const storedKey = Buffer.from(hashHex, "hex");

  if (storedKey.length !== derivedKey.length) return false;

  return timingSafeEqual(storedKey, derivedKey);
}