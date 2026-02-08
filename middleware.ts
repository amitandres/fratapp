import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "fratapp_session";

const getSecret = () => {
  const secret = process.env.SESSION_SECRET ?? "";
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
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

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/app/:path*"],
};
