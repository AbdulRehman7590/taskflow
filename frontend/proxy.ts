import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/signup", "/logout", "/api/auth"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublic = publicPaths.some(
    (item) => path === item || path.startsWith(`${item}/`),
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const sessionCookieName =
    process.env.SESSION_COOKIE_NAME ?? "taskflow_session";

  const session = request.cookies.get(sessionCookieName);

  if (!session) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { message: "You must be signed in to continue." },
        { status: 401 },
      );
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};