import { NextResponse, type NextRequest } from "next/server";

// Pages, actions and API handlers validate sessions and roles at the data boundary.
// This inexpensive check only redirects visitors who have no session cookie.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (["/login", "/signup", "/api/health"].includes(pathname))
    return NextResponse.next();
  if (
    request.cookies.has(process.env.SESSION_COOKIE_NAME ?? "taskflow_session")
  ) {
    return NextResponse.next();
  }
  return pathname.startsWith("/api/")
    ? NextResponse.json(
        { message: "You must be signed in to continue." },
        { status: 401 },
      )
    : NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
