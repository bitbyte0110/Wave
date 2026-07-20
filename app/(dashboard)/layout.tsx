"use client"

import type React from "react"

import { useEffect, useState, Suspense, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell } from "lucide-react"
import SideNavigation from "@/components/side-navigation"
import AccountDropdown from "@/components/account-dropdown"
import MobileSidebarToggle from "@/components/mobile-sidebar-toggle"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const [riskReports, setRiskReports] = useState<
    { id: number; title: string; detail: string; level: "Low" | "Moderate" | "Elevated"; time: string }[]
  >([])

  const notificationDropdownRef = useRef<HTMLDivElement>(null)

  // Check if user is logged in
  useEffect(() => {
    // Check for login status
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true" || document.cookie.includes("isLoggedIn=true")

    if (!isLoggedIn) {
      router.push("/login")
    } else {
      setIsLoading(false)
    }
  }, [router])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar")
      const toggle = document.getElementById("mobile-sidebar-toggle")

      if (
        mobileSidebarOpen &&
        sidebar &&
        toggle &&
        !sidebar.contains(event.target as Node) &&
        !toggle.contains(event.target as Node)
      ) {
        setMobileSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [mobileSidebarOpen])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [mobileSidebarOpen])

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Listen for swap confirmations and slide open the AI risk report notification
  useEffect(() => {
    function handleRiskReport(event: Event) {
      const detail = (event as CustomEvent).detail as {
        usd: number
        btc: number
        rate: number
        time: string
      }

      // Derive a lightweight risk assessment from the trade size.
      const level: "Low" | "Moderate" | "Elevated" =
        detail.usd >= 25000 ? "Elevated" : detail.usd >= 5000 ? "Moderate" : "Low"

      setRiskReports((prev) => [
        {
          id: Date.now(),
          title: "AI Risk Report",
          detail: `Swapped $${detail.usd.toLocaleString()} → ${detail.btc.toFixed(6)} BTC @ $${detail.rate.toLocaleString()}. Exposure impact: ${level}. Volatility within your configured limits.`,
          level,
          time: "Just now",
        },
        ...prev,
      ])
      setNotificationDropdownOpen(true)
    }

    window.addEventListener("wave:risk-report", handleRiskReport)
    return () => window.removeEventListener("wave:risk-report", handleRiskReport)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="h-full w-full">
        <div className="bg-card shadow-lg h-full">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-4">
              <div id="mobile-sidebar-toggle">
                <MobileSidebarToggle onToggle={setMobileSidebarOpen} isOpen={mobileSidebarOpen} />
              </div>
              <h1 className="text-primary font-bold text-xl">Your Logo</h1>
            </div>

            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search here"
                className="bg-muted rounded-full py-2 px-4 pr-10 text-sm w-80"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center space-x-5">
              <div className="hidden md:flex items-center space-x-4">
                <a
                  href="https://x.com/OxKaras"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
                  aria-label="Twitter/X Profile"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                  </svg>
                </a>
                <a
                  href="https://github.com/karasbuilder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  aria-label="GitHub Profile"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                  </svg>
                </a>
              </div>

              <div className="relative" ref={notificationDropdownRef}>
                <button
                  className="relative p-1.5 rounded-full hover:bg-muted focus:outline-none transition-colors"
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6 text-foreground" />
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {12 + riskReports.length}
                  </span>
                </button>

                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border z-50 animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Notifications</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-primary hover:text-primary/90 cursor-pointer">
                            Mark all as read
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                      {riskReports.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
                      ) : (
                        riskReports.map((report) => (
                          <div
                            key={report.id}
                            className="p-3 border-b border-border hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-top-2 duration-300"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-foreground">{report.title}</span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  report.level === "Elevated"
                                    ? "bg-red-100 text-red-700"
                                    : report.level === "Moderate"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {report.level} risk
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{report.detail}</p>
                            <span className="text-[10px] text-muted-foreground/70 mt-1 block">{report.time}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 border-t border-border text-center">
                      <button className="text-sm text-primary hover:text-primary/90 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <AccountDropdown />
            </div>
          </header>

          {/* Mobile Social Links - Shown below header on small screens */}
          <div className="md:hidden flex items-center justify-center space-x-4 py-2 border-b border-border">
            <a
              href="https://x.com/OxKaras"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-3 py-1 rounded-full bg-black text-white text-xs"
              aria-label="Twitter/X Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
              <span>@OxKaras</span>
            </a>
            <a
              href="https://github.com/karasbuilder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-800 text-white text-xs"
              aria-label="GitHub Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
              </svg>
              <span>karasbuilder</span>
            </a>
          </div>

          <div className="flex h-[calc(100vh-73px)]">
            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" />}

            {/* Sidebar */}
            <div
              id="mobile-sidebar"
              className={`${
                mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              } fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-[300px]`}
            >
              <SideNavigation onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto w-full">
              <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
