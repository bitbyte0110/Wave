"use client"

import type React from "react"
import { useEffect, useState, Suspense, useRef } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import SideNavigation from "@/components/side-navigation"
import AccountDropdown from "@/components/account-dropdown"
import MobileSidebarToggle from "@/components/mobile-sidebar-toggle"
import HeaderSearch from "@/components/header-search"
import { isAuthenticated } from "@/lib/auth"
import { MarketStreamProvider, useMarketStream } from "@/context/market-context"
import { toast, Toaster } from "sonner"

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const [riskReports, setRiskReports] = useState<
    { id: number; title: string; detail: string; level: "Low" | "Moderate" | "Elevated"; time: string }[]
  >([])

  const notificationDropdownRef = useRef<HTMLDivElement>(null)
  const { notifications } = useMarketStream()
  const processedNotifIds = useRef<Set<string>>(new Set())

  // Check if user is logged in
  useEffect(() => {
    const loggedIn = isAuthenticated() || sessionStorage.getItem("isLoggedIn") === "true" || document.cookie.includes("isLoggedIn=true")

    if (!loggedIn) {
      router.push("/login")
    } else {
      setIsLoading(false)
    }
  }, [router])

  // Sync STOMP notifications from Global Market Context
  useEffect(() => {
    if (!notifications || notifications.length === 0) return

    notifications.forEach((notification) => {
      const key = `${notification.txId}_${notification.status}`
      if (processedNotifIds.current.has(key)) return

      processedNotifIds.current.add(key)

      const level: "Low" | "Moderate" | "Elevated" =
        notification.remark && notification.remark.toLowerCase().includes("high")
          ? "Elevated"
          : notification.remark && notification.remark.toLowerCase().includes("moderate")
          ? "Moderate"
          : "Low"

      toast.success(`AI Risk Audit Complete: ${notification.remark}`, {
        description: `Transaction #${notification.txId} · Status: ${notification.status}`,
      })

      setRiskReports((prev) => [
        {
          id: Date.now(),
          title: `AI Risk Audit #${notification.txId}`,
          detail: `${notification.remark} (${notification.status})`,
          level,
          time: "Just now",
        },
        ...prev,
      ])
    })
  }, [notifications])

  // Custom Event listener for instant swap notifications
  useEffect(() => {
    function handleCustomRiskReport(event: Event) {
      const detail = (event as CustomEvent).detail as {
        usd: number
        btc: number
        rate: number
        time?: string
      }

      if (!detail || !detail.usd) return

      const level: "Low" | "Moderate" | "Elevated" =
        detail.usd >= 25000 ? "Elevated" : detail.usd >= 5000 ? "Moderate" : "Low"

      const remark = `Swapped $${detail.usd.toLocaleString()} → ${detail.btc ? detail.btc.toFixed(6) : "0"} BTC @ $${detail.rate ? detail.rate.toLocaleString() : "68,059"}. Risk: ${level}.`

      toast.info("Swap Executed — AI Risk Audit Queued", {
        description: remark,
      })

      setRiskReports((prev) => [
        {
          id: Date.now(),
          title: "Swap Executed",
          detail: remark,
          level,
          time: "Just now",
        },
        ...prev,
      ])
    }

    window.addEventListener("wave:risk-report", handleCustomRiskReport)

    return () => {
      window.removeEventListener("wave:risk-report", handleCustomRiskReport)
    }
  }, [])

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
      <Toaster position="top-right" richColors />
      <div className="h-full w-full">
        <div className="bg-card shadow-lg h-full">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-4">
              <div id="mobile-sidebar-toggle">
                <MobileSidebarToggle onToggle={setMobileSidebarOpen} isOpen={mobileSidebarOpen} />
              </div>
              <h1 className="text-primary font-bold text-xl">Wave Terminal</h1>
            </div>

            <HeaderSearch />

            <div className="flex items-center space-x-5">
              <div className="relative" ref={notificationDropdownRef}>
                <button
                  className="relative p-1.5 rounded-full hover:bg-muted focus:outline-none transition-colors"
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6 text-foreground" />
                  {riskReports.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                      {riskReports.length}
                    </span>
                  )}
                </button>

                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border z-50 animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Notifications</h3>
                        <div className="flex items-center space-x-2">
                          <span
                            onClick={() => setRiskReports([])}
                            className="text-xs text-primary hover:text-primary/90 cursor-pointer"
                          >
                            Clear all
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
                                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                    : report.level === "Moderate"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
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

          <div className="flex h-[calc(100vh-57px)]">
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketStreamProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </MarketStreamProvider>
  )
}
