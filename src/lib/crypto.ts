/**
 * Simple AES-GCM encryption for sensitive data stored in IndexedDB.
 * Uses a device-specific key derived from a fixed salt + origin.
 * This protects against casual IndexedDB inspection but not a determined attacker
 * with full access to the device (since the key material is derivable).
 */

const SALT = "paisabachao-v1";
const ALGO = "AES-GCM";

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  // Derive a key from origin + salt — unique per-device per-origin
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(window.location.origin + SALT),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encoder.encode(SALT), iterations: 100000, hash: "SHA-256" },
    material,
    { name: ALGO, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return "";
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded);
  // Pack iv + ciphertext as base64
  const packed = new Uint8Array(iv.length + ciphertext.byteLength);
  packed.set(iv);
  packed.set(new Uint8Array(ciphertext), iv.length);
  return "enc:" + btoa(String.fromCharCode(...packed));
}

export async function decrypt(stored: string): Promise<string> {
  if (!stored) return "";
  // Backward compat: if not encrypted, return as-is
  if (!stored.startsWith("enc:")) return stored;
  const key = await getKey();
  const packed = Uint8Array.from(atob(stored.slice(4)), (c) => c.charCodeAt(0));
  const iv = packed.slice(0, 12);
  const ciphertext = packed.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}
