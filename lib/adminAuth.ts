import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "ls_admin";

function getSecret(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD não configurada.");
  }
  return password;
}

/**
 * Cookie de sessão simples para um único usuário admin (MVP): HMAC da senha
 * configurada em ADMIN_PASSWORD, sem estado no servidor. Suficiente para uso
 * interno; se o admin crescer, trocar por uma sessão de verdade (ex: NextAuth).
 */
export function computeAdminCookieValue(): string {
  const secret = getSecret();
  return createHmac("sha256", secret).update("lemonseo-admin-session").digest("hex");
}

export function isValidAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isValidAdminCookie(value: string | undefined): boolean {
  if (!value || !process.env.ADMIN_PASSWORD) return false;
  const expected = computeAdminCookieValue();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
