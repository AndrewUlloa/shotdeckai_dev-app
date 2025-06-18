"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { motion as m } from "framer-motion"
import { IconButton } from "@/components/ui/icon-button"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

// SVG path data
const moonPath = "M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"

// Variants for animations
const centralShapeVariants = {
  light: {
    fillOpacity: 1,
    strokeOpacity: 1,
    fill: "#FFFFFF", // white
    stroke: "#FFFFFF", // white
    rotate: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  },
  dark: {
    fillOpacity: 1,
    strokeOpacity: 1,
    fill: "#FFFFFF", // white
    stroke: "#FFFFFF", // white
    rotate: 360,
    scale: 1.1,
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  }
}

const raysVariants = {
  light: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  dark: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
}

const rayVariant = {
  light: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3
    }
  },
  dark: {
    opacity: 0,
    scale: 0,
    transition: {
      duration: 0.3
    }
  }
}

const shineVariant = {
  light: {
    opacity: 0,
    strokeDasharray: "0 100",
    strokeDashoffset: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.3
    }
  },
  dark: {
    opacity: 0.3,
    strokeDasharray: "20 80",
    strokeDashoffset: -100,
    filter: "blur(1px)",
    transition: {
      duration: 0.6,
      ease: "linear"
    }
  }
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <IconButton className="w-4 h-4">
        <div className="w-4 h-4" />
      </IconButton>
    )
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <IconButton className="w-4 h-4" onClick={toggleTheme}>
      <m.svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={theme === "dark" ? "dark" : "light"}
        className="flex-shrink-0"
      >
        {/* Central shape (sun/moon) */}
        <m.path
          d={theme === "dark" ? moonPath : "M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"}
          variants={centralShapeVariants}
          initial={false}
          animate={theme === "dark" ? "dark" : "light"}
        />
        
        {/* Sun rays */}
        <m.g
          variants={raysVariants}
          initial={false}
          animate={theme === "dark" ? "dark" : "light"}
        >
          {/* Top ray */}
          <m.path
            d="M12 3v3"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            variants={rayVariant}
          />
          {/* Top right ray */}
          <m.path
            d="M18.364 5.636l-2.121 2.121"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            variants={rayVariant}
          />
          {/* Right ray */}
          <m.path
            d="M21 12h-3"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            variants={rayVariant}
          />
          {/* Bottom right ray */}
          <m.path
            d="M18.364 18.364l-2.121-2.121"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            variants={rayVariant}
          />
          {/* Bottom ray */}
          <m.path
            d="M12 21v-3"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            variants={rayVariant}
          />
          {/* Bottom left ray */}
          <m.path
            d="M5.636 18.364l2.121-2.121"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            variants={rayVariant}
          />
          {/* Left ray */}
          <m.path
            d="M3 12h3"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            variants={rayVariant}
          />
          {/* Top left ray */}
          <m.path
            d="M5.636 5.636l2.121 2.121"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            variants={rayVariant}
          />
        </m.g>
        
        {/* Moon shine effect */}
        <m.path
          d={moonPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1"
          className="absolute"
          variants={shineVariant}
          initial={false}
          animate={theme === "dark" ? "dark" : "light"}
        />
      </m.svg>
      <span className="sr-only">Toggle theme</span>
    </IconButton>
  )
}

// Keep the dropdown version for backward compatibility if needed
export function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (theme === "light") setTheme("dark")
        else if (theme === "dark") setTheme("system")
        else setTheme("light")
      }}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 