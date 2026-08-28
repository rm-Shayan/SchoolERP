import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/entry',
  '/login',
  '/admin/login',
  '/parent/login',
  '/unauthorized',
];

// Routes that match /o/:slug patterns
const isOrgRoute = (path: string) => /^\/o\/[^/]+(\/|$)/.test(path);

// Routes that require SUPER_ADMIN role
const isAdminRoute = (path: string) => path.startsWith('/admin') && !path.startsWith('/admin/login');

// Routes that require branch admin roles
const isBranchRoute = (path: string) => path.startsWith('/branch') || /^\/o\/[^/]+\/branch(\/|$)/.test(path);

// Routes that require teacher role
const isTeacherRoute = (path: string) => path.startsWith('/teacher') || /^\/o\/[^/]+\/teacher(\/|$)/.test(path);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and API routes
  if (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/')) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Allow org public routes (landing page, admission form)
  if (isOrgRoute(pathname)) {
    // /o/:slug is public, /o/:slug/admission is public
    const slugPath = pathname.replace(/^\/o\/[^/]+/, '');
    if (!slugPath || slugPath === '/' || slugPath.startsWith('/admission')) {
      return NextResponse.next();
    }
    // Branch/teacher/gate routes within org need auth
    if (slugPath.startsWith('/branch') || slugPath.startsWith('/teacher') || slugPath.startsWith('/gate')) {
      // Auth check happens client-side via ProtectedRoute
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // All other routes - let client-side auth handle it
  // (ProtectedRoute component checks localStorage tokens)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
