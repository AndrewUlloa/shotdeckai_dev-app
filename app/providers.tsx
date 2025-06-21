'use client'

import { ThemeProvider } from 'next-themes'
import { ReactNode, useEffect } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Client-side locale detection fallback
    const checkAndSetLocale = async () => {
      // Check if locale cookie already exists
      const existingLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('locale='))
        ?.split('=')[1]
      
      if (!existingLocale) {
        try {
          // Try to detect country using a free IP geolocation service
          const response = await fetch('https://ipapi.co/json/')
          const data = await response.json()
          
          if (data.country_code === 'CO') {
            // Set Colombian Spanish locale
            document.cookie = 'locale=es-CO; path=/; max-age=31536000'
            window.location.reload()
          } else if (data.languages?.includes('es')) {
            // Set Spanish for other Spanish-speaking countries
            document.cookie = 'locale=es-CO; path=/; max-age=31536000'
            window.location.reload()
          }
        } catch (error) {
          console.error('Failed to detect location:', error)
          
          // Fallback to browser language
          const browserLang = navigator.language.toLowerCase()
          if (browserLang.includes('es')) {
            document.cookie = 'locale=es-CO; path=/; max-age=31536000'
            window.location.reload()
          }
        }
      }
    }
    
    checkAndSetLocale()
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}