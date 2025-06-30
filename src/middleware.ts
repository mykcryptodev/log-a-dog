import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add cache headers for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Add cache headers for API routes based on endpoint
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const pathname = request.nextUrl.pathname;
    
    // Long cache for metadata endpoints
    if (pathname.includes('/metadata/') || pathname.includes('/ipfs/')) {
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    }
    // Medium cache for profiles and leaderboards
    else if (pathname.includes('/profile/') || pathname.includes('/leaderboard/')) {
      response.headers.set('Cache-Control', 'public, max-age=900, s-maxage=900');
    }
    // Short cache for dynamic content
    else if (pathname.includes('/hotdog/') || pathname.includes('/staking/')) {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    }
    // No cache for auth and user-specific endpoints
    else if (pathname.includes('/auth/') || pathname.includes('/user/')) {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    }
  }

  // Add cache headers for pages
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    // Cache static pages longer
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/about')) {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    }
    // Don't cache user-specific pages
    else if (request.nextUrl.pathname.startsWith('/profile/') || request.nextUrl.pathname.startsWith('/dashboard/')) {
      response.headers.set('Cache-Control', 'private, no-cache');
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};