"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Theme = "light" | "dark" | "system"
type ColorScheme = "emerald" | "blue" | "purple" | "orange"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  colorScheme: ColorScheme
  setColorScheme: (colorScheme: ColorScheme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [colorScheme, setColorScheme] = useState<ColorScheme>("emerald")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  // Initialize theme and color scheme from localStorage
  useEffect(() => {
    setMounted(true)
    const storedTheme = localStorage.getItem("theme") as Theme
    const storedColorScheme = localStorage.getItem("colorScheme") as ColorScheme

    if (storedTheme) {
      setTheme(storedTheme)
    }

    if (storedColorScheme) {
      setColorScheme(storedColorScheme)
    }
  }, [])

  // Update localStorage when theme or color scheme changes
  useEffect(() => {
    if (!mounted) return

    localStorage.setItem("theme", theme)
    localStorage.setItem("colorScheme", colorScheme)

    // Apply theme to document
    if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
      setResolvedTheme("dark")
    } else {
      document.documentElement.classList.remove("dark")
      setResolvedTheme("light")
    }

    // Apply color scheme to document
    document.documentElement.setAttribute("data-color-scheme", colorScheme)
  }, [theme, colorScheme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      if (mediaQuery.matches) {
        document.documentElement.classList.add("dark")
        setResolvedTheme("dark")
      } else {
        document.documentElement.classList.remove("dark")
        setResolvedTheme("light")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, mounted])

  // Avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme, setColorScheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
