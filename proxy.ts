import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }

  const session = request.cookies.get('aw-session')
  if (!session || session.value !== process.env.PORTAL_PASSWORD) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
