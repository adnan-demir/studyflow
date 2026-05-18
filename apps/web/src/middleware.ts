export { auth as middleware } from "@/lib/auth";

export const config = {
  // Protect all routes except static assets and API auth handler
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
