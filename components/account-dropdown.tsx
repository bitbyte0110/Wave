"use client"

import { useState, useRef, useEffect } from "react"
import { User, LogOut, Settings, UserCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await logout()
    router.push("/login")
  }

  const navigateToSettings = () => {
    setIsOpen(false)
    router.push("/settings")
  }

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="account-dropdown-btn"
        className={`bg-primary rounded-full p-2 transition-all duration-200 ${isOpen ? "ring-2 ring-primary/30" : "hover:bg-primary/90"}`}
        onClick={handleToggle}
        aria-label="User Account"
      >
        <User className="h-5 w-5 text-primary-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-card ring-1 ring-black/5 dark:ring-white/10 z-50 animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="py-3 px-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/20 rounded-full p-2 shrink-0">
                <UserCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-foreground">{user?.username || "User Account"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "Signed in"}</p>
                {user?.userId && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                    UID: #{user.userId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={navigateToSettings}
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
            >
              <UserCircle className="h-4 w-4 mr-3 text-muted-foreground" />
              My Profile
            </button>
            <button
              onClick={navigateToSettings}
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-150"
            >
              <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
              Settings
            </button>
          </div>

          <div className="py-1 border-t border-border">
            <button
              id="sign-out-btn"
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-muted transition-colors duration-150 font-medium"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
