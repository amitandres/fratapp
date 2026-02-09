import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken as createToken,
  verifySessionToken,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/jwt";

const SESSION_COOKIE_NAME = "fratapp_session";

/** Lax = cookie sent when user navigates to site from external links (email, bookmark). Strict would block that. */
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

type SessionRole = "member" | "treasurer" | "exec" | "admin";

export const createSessionToken = async (payload: {
  userId: string;
  role: SessionRole;
  orgId: string;
}) => createToken(payload);

export const setSessionCookie = async (payload: {
  userId: string;
  role: SessionRole;
  orgId: string;
}) => {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
};

/** Set session cookie on a specific response (e.g. redirect). Use for form-POST login flows. */
export const setSessionCookieOnResponse = async (
  response: NextResponse,
  payload: { userId: string; role: SessionRole; orgId: string }
) => {
  const token = await createSessionToken(payload);
  response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
};

export const clearSessionCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
};

/** Refresh session if it has less than 14 days left. Keeps active users logged in. */
export const maybeRefreshSession = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;

  try {
    const payload = await verifySessionToken(token);
    const exp = payload.exp ?? 0;
    const timeLeft = exp - Math.floor(Date.now() / 1000);
    const refreshThreshold = 60 * 60 * 24 * 14; // refresh when < 14 days left
    if (timeLeft > 0 && timeLeft < refreshThreshold) {
      const newToken = await createSessionToken({
        userId: payload.sub!,
        role: payload.role as SessionRole,
        orgId: payload.orgId!,
      });
      cookieStore.set(SESSION_COOKIE_NAME, newToken, SESSION_COOKIE_OPTIONS);
    }
  } catch {
    // Token invalid, ignore
  }
};

export const getSessionUser = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const payload = await verifySessionToken(token);
    return {
      userId: payload.sub ?? null,
      role: payload.role,
      orgId: payload.orgId,
    };
  } catch {
    return null;
  }
};

export const getSessionUserId = async () => {
  const session = await getSessionUser();
  return session?.userId ?? null;
};

export const getCurrentUserAndProfile = async () => {
  const session = await getSessionUser();
  if (!session?.userId) {
    return null;
  }

  const profile = await prisma.profiles.findUnique({
    where: { user_id: session.userId },
    select: {
      org_id: true,
      role: true,
    },
  });

  if (!profile) {
    return null;
  }

  return {
    userId: session.userId,
    orgId: profile.org_id,
    role: profile.role,
  };
};

export const requireCurrentUserAndProfile = async () => {
  const session = await getCurrentUserAndProfile();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
};

export const requireRole = async (role: SessionRole) => {
  const session = await getSessionUser();
  if (!session || session.role !== role) {
    throw new Error("Forbidden");
  }
  return session;
};

const ADMIN_ROLES = ["admin", "exec", "treasurer"] as const;
const EXEC_ROLES = ["admin", "exec"] as const;

export const requireAdminRole = async () => {
  const session = await getSessionUser();
  if (!session || !ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number])) {
    throw new Error("Forbidden");
  }
  return session;
};

export const requireExecRole = async () => {
  const session = await getSessionUser();
  if (!session || !EXEC_ROLES.includes(session.role as (typeof EXEC_ROLES)[number])) {
    throw new Error("Forbidden");
  }
  return session;
};
