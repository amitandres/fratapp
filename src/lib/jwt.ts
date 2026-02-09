import { SignJWT, jwtVerify } from "jose";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

const getSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET must be set and at least 16 characters. Check your Vercel/env config."
    );
  }
  return new TextEncoder().encode(secret);
};

export type SessionPayload = {
  sub: string;
  role: string;
  orgId: string;
  exp?: number;
};

export async function createSessionToken(payload: {
  userId: string;
  role: string;
  orgId: string;
}) {
  return new SignJWT({ role: payload.role, orgId: payload.orgId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify<SessionPayload>(token, getSecret());
  return payload;
}

export { SESSION_MAX_AGE_SECONDS };
