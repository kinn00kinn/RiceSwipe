import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from './lib/supabase/utils'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // if user is not signed in and the current path is not /login,
  // redirect the user to the /login page
  if (!session && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // if user is signed in and the current path is /login,
  // redirect the user to the home page
  if (session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth/callback (Supabase auth callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}
