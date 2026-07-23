"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { Search, X, ArrowRight, Wallet, ArrowLeftRight, Settings, LayoutDashboard, TrendingUp, TrendingDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMarketStream } from "@/context/market-context"

interface SearchCoin {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  icon: string
  iconClass: string
  category: "crypto"
}

interface PageItem {
  id: string
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  category: "page"
}

interface ActionItem {
  id: string
  name: string
  description: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  category: "action"
}

const DEFAULT_COINS: SearchCoin[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    price: 68059.49,
    change24h: 0.41,
    icon: "₿",
    iconClass: "bg-amber-500/20 text-amber-500",
    category: "crypto",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    price: 3403.77,
    change24h: 0.33,
    icon: "Ξ",
    iconClass: "bg-indigo-500/20 text-indigo-400",
    category: "crypto",
  },
  {
    id: "usdt",
    symbol: "USDT",
    name: "Tether / USDC",
    price: 1.015,
    change24h: 0.42,
    icon: "₮",
    iconClass: "bg-emerald-500/20 text-emerald-400",
    category: "crypto",
  },
  {
    id: "bnb",
    symbol: "BNB",
    name: "BNB",
    price: 581.01,
    change24h: 0.18,
    icon: "N",
    iconClass: "bg-yellow-500/20 text-yellow-400",
    category: "crypto",
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "Ripple",
    price: 0.5853,
    change24h: -0.12,
    icon: "✕",
    iconClass: "bg-blue-500/20 text-blue-400",
    category: "crypto",
  },
]

const PAGES: PageItem[] = [
  { id: "page-dashboard", name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, category: "page" },
  { id: "page-wallet", name: "Wallet Ledger", path: "/wallet", icon: Wallet, category: "page" },
  { id: "page-swap", name: "Instant Swap", path: "/swap", icon: ArrowLeftRight, category: "page" },
  { id: "page-settings", name: "Settings", path: "/settings", icon: Settings, category: "page" },
]

const ACTIONS: ActionItem[] = [
  { id: "act-deposit", name: "Deposit Crypto / USD", description: "Add funds to wallet", path: "/wallet", icon: Wallet, category: "action" },
  { id: "act-swap", name: "Swap Tokens Instant", description: "Execute instant trade", path: "/swap", icon: ArrowLeftRight, category: "action" },
]

export default function HeaderSearch() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { latestTick, overview } = useMarketStream()

  // Dynamic price updates from WebSocket stream & overview cache
  const coins = useMemo(() => {
    return DEFAULT_COINS.map((coin) => {
      if (coin.id === "btc") {
        const price = latestTick?.btcUsd ?? overview?.btcUsd ?? coin.price
        const change24h = latestTick?.btc24hPct ?? overview?.btc24hPct ?? coin.change24h
        return { ...coin, price, change24h }
      }
      if (coin.id === "usdt") {
        const price = latestTick?.usdcUsd ?? coin.price
        return { ...coin, price }
      }
      return coin
    })
  }, [latestTick, overview])

  // Filter items based on user search query
  const filteredCoins = useMemo(() => {
    if (!query.trim()) return coins
    const q = query.toLowerCase().trim()
    return coins.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
  }, [query, coins])

  const filteredPages = useMemo(() => {
    if (!query.trim()) return PAGES
    const q = query.toLowerCase().trim()
    return PAGES.filter((p) => p.name.toLowerCase().includes(q))
  }, [query])

  const filteredActions = useMemo(() => {
    if (!query.trim()) return ACTIONS
    const q = query.toLowerCase().trim()
    return ACTIONS.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
  }, [query])

  // Flat list for keyboard navigation
  const allResults = useMemo(() => {
    return [
      ...filteredCoins.map((c) => ({ type: "crypto" as const, item: c })),
      ...filteredPages.map((p) => ({ type: "page" as const, item: p })),
      ...filteredActions.map((a) => ({ type: "action" as const, item: a })),
    ]
  }, [filteredCoins, filteredPages, filteredActions])

  // Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      } else if (e.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard navigation up/down/enter
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || allResults.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % allResults.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const current = allResults[selectedIndex]
      if (current) {
        handleSelect(current)
      }
    }
  }

  const handleSelect = (result: (typeof allResults)[number]) => {
    setIsOpen(false)
    setQuery("")

    if (result.type === "crypto") {
      // Navigate to swap or wallet with coin preselected
      router.push(`/swap?from=${result.item.symbol.toLowerCase()}`)
    } else if (result.type === "page" || result.type === "action") {
      router.push(result.item.path)
    }
  }

  return (
    <div className="relative hidden sm:block w-80 md:w-96" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setSelectedIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search markets, assets, pages... (Ctrl+K)"
          className="w-full bg-muted/60 border border-border/50 focus:border-primary/50 focus:bg-background rounded-full py-2 pl-10 pr-20 text-sm outline-none transition-all duration-200 shadow-inner"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="absolute right-3.5 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="absolute right-3 top-2.5 flex items-center space-x-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-background border border-border rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl shadow-2xl bg-card border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200 max-h-[460px] overflow-y-auto">
          {allResults.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No matching assets or actions found for <span className="font-semibold text-foreground">"{query}"</span>
            </div>
          ) : (
            <div className="py-2">
              {/* Cryptos Section */}
              {filteredCoins.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Live Market Crypto</span>
                    <span className="text-[10px] font-normal lowercase text-muted-foreground">realtime feed</span>
                  </div>
                  {filteredCoins.map((coin) => {
                    const globalIdx = allResults.findIndex((r) => r.type === "crypto" && r.item.id === coin.id)
                    const isSelected = globalIdx === selectedIndex

                    return (
                      <div
                        key={coin.id}
                        onClick={() => handleSelect({ type: "crypto", item: coin })}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                          isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${coin.iconClass}`}>
                            {coin.icon}
                          </div>
                          <div>
                            <div className="text-sm font-semibold flex items-center space-x-1.5">
                              <span>{coin.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">({coin.symbol})</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">Click to instant swap</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-mono font-semibold">
                            ${coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </div>
                          <div className={`text-xs font-mono flex items-center justify-end ${coin.change24h >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {coin.change24h >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5 inline" /> : <TrendingDown className="h-3 w-3 mr-0.5 inline" />}
                            {coin.change24h >= 0 ? "+" : ""}
                            {coin.change24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pages Section */}
              {filteredPages.length > 0 && (
                <div className="mb-2 border-t border-border/50 pt-2">
                  <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Navigation
                  </div>
                  {filteredPages.map((page) => {
                    const globalIdx = allResults.findIndex((r) => r.type === "page" && r.item.id === page.id)
                    const isSelected = globalIdx === selectedIndex
                    const Icon = page.icon

                    return (
                      <div
                        key={page.id}
                        onClick={() => handleSelect({ type: "page", item: page })}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`px-4 py-2 flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                          isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{page.name}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Actions Section */}
              {filteredActions.length > 0 && (
                <div className="border-t border-border/50 pt-2">
                  <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Quick Actions
                  </div>
                  {filteredActions.map((act) => {
                    const globalIdx = allResults.findIndex((r) => r.type === "action" && r.item.id === act.id)
                    const isSelected = globalIdx === selectedIndex
                    const Icon = act.icon

                    return (
                      <div
                        key={act.id}
                        onClick={() => handleSelect({ type: "action", item: act })}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`px-4 py-2 flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                          isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-sm font-medium">{act.name}</div>
                            <div className="text-xs text-muted-foreground">{act.description}</div>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
