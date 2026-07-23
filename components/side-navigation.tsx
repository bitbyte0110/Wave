"use client"

import { Wallet, Settings, ArrowLeftRight } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface SideNavigationProps {
  onCloseMobile?: () => void
}

export default function SideNavigation({ onCloseMobile }: SideNavigationProps) {
  const pathname = usePathname()

  const handleClick = () => {
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true
    if (path === "/wallet" && pathname === "/wallet") return true
    if (path === "/swap" && pathname === "/swap") return true
    if (path === "/settings" && pathname === "/settings") return true
    return pathname === path
  }

  return (
    <div className="w-full h-full flex flex-col bg-card text-card-foreground">
      <nav className="py-6 flex-1">
        <ul className="space-y-6">
          <li>
            <Link
              href="/dashboard"
              onClick={handleClick}
              className={`flex items-center w-full px-6 py-2 font-medium relative group transition-all duration-200 hover:bg-primary/10 active:bg-primary/20 rounded-md ${isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <div className="relative mr-3 flex items-center justify-center">
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-md opacity-${isActive("/dashboard") ? "20" : "0"} group-hover:opacity-30 transition-opacity duration-200`}
                ></div>
                <div className="grid grid-cols-2 gap-0.5 p-1">
                  <div className="h-1.5 w-1.5 bg-primary rounded-sm"></div>
                  <div className="h-1.5 w-1.5 bg-primary rounded-sm"></div>
                  <div className="h-1.5 w-1.5 bg-primary rounded-sm"></div>
                  <div className="h-1.5 w-1.5 bg-primary rounded-sm"></div>
                </div>
              </div>
              <span className="transition-all duration-200 group-hover:translate-x-1 group-active:translate-x-0">
                Dashboard
              </span>
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r transition-all duration-200 ${isActive("/dashboard") ? "h-4/5" : "group-hover:h-4/5"}`}
              ></span>
            </Link>
          </li>
          <li>
            <Link
              href="/wallet"
              onClick={handleClick}
              className={`flex items-center w-full px-6 py-2 font-medium relative group transition-all duration-200 hover:bg-primary/10 active:bg-primary/20 rounded-md ${isActive("/wallet") ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <Wallet className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110 group-active:scale-95" />
              <span className="transition-all duration-200 group-hover:translate-x-1 group-active:translate-x-0">
                Wallet
              </span>
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r transition-all duration-200 ${isActive("/wallet") ? "h-4/5" : "group-hover:h-4/5"}`}
              ></span>
            </Link>
          </li>
          <li>
            <Link
              href="/swap"
              onClick={handleClick}
              className={`flex items-center w-full px-6 py-2 font-medium relative group transition-all duration-200 hover:bg-primary/10 active:bg-primary/20 rounded-md ${isActive("/swap") ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <ArrowLeftRight className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110 group-active:scale-95" />
              <span className="transition-all duration-200 group-hover:translate-x-1 group-active:translate-x-0">
                Swap
              </span>
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r transition-all duration-200 ${isActive("/swap") ? "h-4/5" : "group-hover:h-4/5"}`}
              ></span>
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              onClick={handleClick}
              className={`flex items-center w-full px-6 py-2 font-medium relative group transition-all duration-200 hover:bg-primary/10 active:bg-primary/20 rounded-md ${isActive("/settings") ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <Settings className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110 group-active:scale-95" />
              <span className="transition-all duration-200 group-hover:translate-x-1 group-active:translate-x-0">
                Settings
              </span>
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r transition-all duration-200 ${isActive("/settings") ? "h-4/5" : "group-hover:h-4/5"}`}
              ></span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="px-6 py-6 border-t border-border mt-auto text-center">
        <a
          href="https://github.com/bitbyte0110/Wave"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center justify-center"
        >
          <span className="font-medium">@Wave</span>
        </a>
      </div>
    </div>
  )
}
