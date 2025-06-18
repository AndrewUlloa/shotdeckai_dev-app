"use client"

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { glassStyles, shadowStyles } from '@/lib/theme-config'

export function useThemeAware() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get the actual theme (resolving 'system' to the actual system theme)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  // Helper function to get theme-specific classes
  const getThemeClass = (lightClass: string, darkClass: string) => {
    if (!mounted) return lightClass // Default to light during SSR
    return resolvedTheme === 'dark' ? darkClass : lightClass
  }

  // Helper function for glass morphism effects
  const getGlassClass = () => {
    if (!mounted) return `${glassStyles.base} ${glassStyles.light}`
    return `${glassStyles.base} ${resolvedTheme === 'dark' ? glassStyles.dark : glassStyles.light}`
  }

  // Helper function for shadows
  const getShadowClass = () => {
    if (!mounted) return shadowStyles.light
    return resolvedTheme === 'dark' ? shadowStyles.dark : shadowStyles.light
  }

  return {
    theme: resolvedTheme,
    mounted,
    getThemeClass,
    getGlassClass,
    getShadowClass,
  }
} 