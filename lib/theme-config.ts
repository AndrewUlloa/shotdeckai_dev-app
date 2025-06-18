export const themes = {
  light: {
    name: 'light',
    label: 'Light',
    // You can add specific theme configurations here
  },
  dark: {
    name: 'dark',
    label: 'Dark',
    // You can add specific theme configurations here
  },
  system: {
    name: 'system',
    label: 'System',
    // System theme follows user's OS preference
  },
} as const

export type Theme = keyof typeof themes

// Utility function to get theme-specific classes
export function getThemeClasses(theme?: string) {
  switch (theme) {
    case 'light':
      return 'light'
    case 'dark':
      return 'dark'
    default:
      return ''
  }
}

// Theme-aware glass morphism classes
export const glassStyles = {
  base: 'backdrop-blur-[10px] border',
  light: 'bg-white/10 border-white/50',
  dark: 'bg-black/30 border-white/20',
}

// Theme-aware shadow classes
export const shadowStyles = {
  light: 'shadow-[0px_5px_15px_rgba(0,0,0,0.25)]',
  dark: 'shadow-[0px_5px_15px_rgba(0,0,0,0.5)]',
} 