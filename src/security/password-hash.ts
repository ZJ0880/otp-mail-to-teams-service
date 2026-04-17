import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHex] = storedHash.split(":");

  if (!salt || !expectedHex) {
    return false;
  }

  const actualKey = scryptSync(password, salt, KEY_LENGTH) as Buffer;
  const expectedKey = Buffer.from(expectedHex, "hex");

  if (expectedKey.length !== actualKey.length) {
    return false;
  }

  return timingSafeEqual(expectedKey, actualKey);
}
