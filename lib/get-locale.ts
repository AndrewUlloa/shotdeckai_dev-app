import { cookies } from 'next/headers'
import { Locale } from './translations'

export function getLocale(): Locale {
  const cookieStore = cookies()
  const locale = cookieStore.get('locale')?.value as Locale
  return locale || 'en'
} 