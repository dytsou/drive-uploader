const MIN_SECRET_LENGTH = 32;

export function getLocalStorageAuthSecret(): Uint8Array | null {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    return null;
  }

  return new TextEncoder().encode(secret);
}
