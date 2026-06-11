import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export default auth((req: NextRequest & { auth: unknown }) => {
  const isLoggedIn = !!(req as { auth: unknown }).auth
  const { pathname } = req.nextUrl

  const protectedPaths = ['/projects', '/notifications', '/profile']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect logged-in users away from login page
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/projects', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/projects/:path*',
    '/notifications/:path*',
    '/profile/:path*',
    '/login',
  ],
}
