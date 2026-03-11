import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const cookie = getSessionCookie(req);

    if (!cookie) {
        console.info("[Middleware] No session cookie found for request to", pathname);
    }
    
    const isAuthenticated = !!cookie;

    const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
    const isAuthRoute = pathname.startsWith("/auth");

    // Case 1: Authenticated user trying to access auth routes (login, register, etc.)
    if (isAuthenticated && isAuthRoute) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Case 2: Unauthenticated user trying to access protected routes
    if (!isAuthenticated && isProtectedRoute) {
        const loginUrl = new URL('/auth/login', req.url);
        loginUrl.searchParams.set('redirect', encodeURIComponent(pathname));
        return NextResponse.redirect(loginUrl);
    }

    // Case 3: Authenticated user accessing protected routes → ALLOW
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*', 
        '/admin/:path*', 
        '/auth/:path*'
    ],
};