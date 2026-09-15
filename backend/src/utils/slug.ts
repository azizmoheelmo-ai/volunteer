import { randomBytes } from "crypto";

/** Generates a short, URL-safe, hard-to-guess slug used for the public share link + QR code. */
export function generateUniqueSlug(): string {
  return randomBytes(6).toString("base64url");
}
