import { clerkMiddleware } from "@clerk/nextjs/server";

/** Clerk runs only for /admin; public QR pages never touch auth. */
export default clerkMiddleware(async (auth, req) => {
  if (!req.nextUrl.pathname.startsWith("/admin/sign-in")) await auth.protect();
});

export const config = {
  matcher: ["/admin/:path*"],
};
