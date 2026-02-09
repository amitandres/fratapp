import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifySessionToken,
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/jwt";

const SESSION_COOKIE_NAME = "fratapp_session";
const REFRESH_THRESHOLD = 60 * 60 * 24 * 14; // refresh when < 14 days left

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifySessionToken(token);
    const role = payload.role as string | undefined;
    const orgId = payload.orgId as string | undefined;
    const userId = payload.sub as string | undefined;

    const adminRoles = ["admin", "exec", "treasurer"];
    if (pathname.startsWith("/app/admin") && !adminRoles.includes(role ?? "")) {
      return NextResponse.redirect(new URL("/app", request.url));
    }

    const requestHeaders = new Headers(request.headers);
    if (userId) requestHeaders.set("x-user-id", userId);
    if (orgId) requestHeaders.set("x-org-id", orgId);
    if (role) requestHeaders.set("x-role", role);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Refresh session if close to expiring (keeps active users logged in)
    const exp = payload.exp ?? 0;
    const timeLeft = exp - Math.floor(Date.now() / 1000);
    if (timeLeft > 0 && timeLeft < REFRESH_THRESHOLD) {
      const newToken = await createSessionToken({
        userId: payload.sub!,
        role: payload.role,
        orgId: payload.orgId!,
      });
      setSessionCookie(response, newToken);
    }

    return response;
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/app", "/app/:path*"],
};
