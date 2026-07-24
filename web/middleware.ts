import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/', '/apps', '/workspace', '/settings', '/knowledge', '/tools', '/models', '/plugins', '/marketplace']

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some(p => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request
  const pathname = nextUrl.pathname

  if (pathname === '/signin' || pathname.startsWith('/auth/') || pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return NextResponse.next()
  }

  if (!isProtected(pathname)) {
    return NextResponse.next()
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_PREFIX || 'https://dify-api-j2fo.onrender.com'
  const refreshUrl = `${apiUrl}/console/api/refresh-token`

  const cookieHeader = cookies.toString()
  if (!cookieHeader) {
    const redirectUrl = new URL('/auth/refresh', nextUrl.origin)
    redirectUrl.searchParams.set('redirect_url', pathname + nextUrl.search)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const redirectUrl = new URL('/auth/refresh', nextUrl.origin)
      redirectUrl.searchParams.set('redirect_url', pathname + nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }

    const setCookies = response.headers.getSetCookie?.() || []
    const nextResponse = NextResponse.next()

    for (const cookie of setCookies) {
      nextResponse.headers.append('Set-Cookie', cookie)
    }

    return nextResponse
  } catch {
    const redirectUrl = new URL('/auth/refresh', nextUrl.origin)
    redirectUrl.searchParams.set('redirect_url', pathname + nextUrl.search)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)',
  ],
}