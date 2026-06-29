import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APEX_HOST = "logadog.xyz";
const CANONICAL_HOST = "www.logadog.xyz";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const { pathname } = request.nextUrl;

  if (host === APEX_HOST && !pathname.startsWith("/.well-known/")) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
