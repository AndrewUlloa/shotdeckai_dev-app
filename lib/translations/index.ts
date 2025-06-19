import { en } from './en'
import { esCO } from './es-CO'

export const translations = {
  en,
  'es-CO': esCO
}

export type Locale = keyof typeof translations
export type TranslationKeys = typeof en 