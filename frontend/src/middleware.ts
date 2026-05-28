import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// We do NOT protect the root route '/' because we want the user to see the dashboard 
// and click a "Sign In" modal button there if they aren't logged in.
const isProtectedRoute = createRouteMatcher([
  '/assignments(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
