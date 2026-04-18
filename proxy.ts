import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

function shouldForceHttps(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(":", "");
  const hostname = request.nextUrl.hostname;
  const isLocalhost =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  return !isLocalhost && protocol === "http";
}

export async function proxy(request: NextRequest) {
  if (shouldForceHttps(request)) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

  if (request.nextUrl.pathname.startsWith("/api/groupme")) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
