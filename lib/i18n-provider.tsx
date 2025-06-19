'use client'

import React, { createContext, useContext } from 'react'
import { translations, Locale } from './translations'

type TranslationContextType = {
  locale: Locale
  t: typeof translations.en
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ 
  children, 
  locale 
}: { 
  children: React.ReactNode
  locale: Locale 
}) {
  const t = translations[locale]
  
  return (
    <TranslationContext.Provider value={{ locale, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslations() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider')
  }
  return context.t
} 