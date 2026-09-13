import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware untuk melindungi route admin
 * Cek apakah user sudah login dan punya role yang sesuai
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Route yang butuh proteksi
  const protectedRoutes = ['/admin', '/dashboard', '/riwayat', '/metode']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Jika protected route, cek session
  // Note: Session check dilakukan di client-side untuk saat ini
  // Untuk production, gunakan Supabase JWT verification di server

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, apple-icon.png (icon files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)',
  ],
}
