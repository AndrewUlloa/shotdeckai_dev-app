import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'es-CO']
const defaultLocale = 'en'

function getLocale(request: NextRequest): string {
  // Check if locale is already set in cookie
  const cookieLocale = request.cookies.get('locale')?.value
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }

  // Get the country from various headers
  const country = request.headers.get('cf-ipcountry') || 
                 request.headers.get('x-vercel-ip-country') || 
                 request.headers.get('x-country')

  // If visitor is from Colombia, use Spanish
  if (country === 'CO') {
    return 'es-CO'
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage?.toLowerCase().includes('es')) {
    return 'es-CO'
  }

  return defaultLocale
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Get locale for this request
  const locale = getLocale(request)
  
  // Set locale in cookie so it persists
  response.cookies.set('locale', locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
  
  return response
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 