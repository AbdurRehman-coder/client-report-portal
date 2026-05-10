import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url))
  response.cookies.set('aw-session', '', { httpOnly: true, maxAge: 0, path: '/' })
  return response
}

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url))
  response.cookies.set('aw-session', '', { httpOnly: true, maxAge: 0, path: '/' })
  return response
}
