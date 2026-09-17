import { NextResponse, type NextRequest } from "next/server";
import { ROUTES, env } from "@/lib/env";
import { resolveSessionUser } from "@/services/auth-service";

const PUBLIC_PATHS = [ROUTES.login, ROUTES.signup, "/api/health"];

const ADMIN_PATHS = ["/directory"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const sessionId = request.cookies.get(env.sessionCookieName)?.value;
  const user = await resolveSessionUser(sessionId);

  if (PUBLIC_PATHS.includes(pathname)) {
    return user && pathname !== "/api/health"
      ? NextResponse.redirect(new URL(ROUTES.home, request.url))
      : NextResponse.next();
  }

  if (!user) {
    return isApi
      ? NextResponse.json(
          { message: "You must be signed in to continue." },
          { status: 401 },
        )
      : NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  if (
    user.role !== "admin" &&
    ADMIN_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return NextResponse.redirect(new URL(ROUTES.home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
