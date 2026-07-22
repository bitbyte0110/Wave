"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { GATEWAY_URL } from "@/lib/auth"

interface MarketOverviewData {
  globalMarketCapUsd: number
  totalVolume24hUsd: number
  btcDominancePct: number
  btcUsd: number
  btc24hPct: number
  cachedAtMs: number
}

function formatCompactUsd(value: number): string {
  if (!value || isNaN(value)) return "--"
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`
  }
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
}

export default function StatsOverview() {
  const [overview, setOverview] = useState<MarketOverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchOverview() {
      const primaryUrl = `${GATEWAY_URL}/api/v1/market/overview`
      const fallbackUrl = "http://localhost:8081/api/v1/market/overview"

      try {
        let res = await fetch(primaryUrl).catch(() => null)
        if (!res || !res.ok) {
          res = await fetch(fallbackUrl).catch(() => null)
        }

        if (res && res.ok && isMounted) {
          const data = await res.json()
          setOverview({
            globalMarketCapUsd: Number(data.globalMarketCapUsd || 0),
            totalVolume24hUsd: Number(data.totalVolume24hUsd || 0),
            btcDominancePct: Number(data.btcDominancePct || 0),
            btcUsd: Number(data.btcUsd || 0),
            btc24hPct: Number(data.btc24hPct || 0),
            cachedAtMs: Number(data.cachedAtMs || Date.now()),
          })
        }
      } catch (err) {
        console.warn("Failed to fetch market overview:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchOverview()
    const interval = setInterval(fetchOverview, 60000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const stats = [
    {
      label: "Global Market Cap",
      value: overview ? formatCompactUsd(overview.globalMarketCapUsd) : "$2.14T",
      change: "+2.3%",
      caption: "vs yesterday",
      up: true,
    },
    {
      label: "24h Trade Volume",
      value: overview ? formatCompactUsd(overview.totalVolume24hUsd) : "$84.5B",
      change: "-1.2%",
      caption: "vs yesterday",
      up: false,
    },
    {
      label: "Bitcoin Dominance",
      value: overview && overview.btcDominancePct > 0 ? `${overview.btcDominancePct.toFixed(1)}%` : "42.1%",
      change: overview && overview.btc24hPct ? `${overview.btc24hPct >= 0 ? "+" : ""}${overview.btc24hPct.toFixed(1)}%` : "+0.5%",
      caption: "market share",
      up: overview ? overview.btc24hPct >= 0 : true,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-sm transition-all"
        >
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1.5">{isLoading && !overview ? "..." : stat.value}</h3>
          </div>
          <div
            className={`flex items-center gap-1.5 text-xs mt-3 font-semibold ${
              stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {stat.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {stat.change} <span className="text-muted-foreground font-normal">{stat.caption}</span>
          </div>
        </div>
      ))}

      {/* Highlighted balance card */}
      <div className="bg-primary/5 border border-primary/30 rounded-lg p-5 flex flex-col justify-between shadow-sm">
        <div>
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Your Balance</p>
          <h3 className="text-2xl font-bold mt-1.5">$12,500.00</h3>
        </div>
        <div className="flex items-center justify-between text-xs mt-3 font-medium text-muted-foreground">
          <span>Includes 2.1005 BTC</span>
          <span className="bg-primary/15 text-primary px-2 py-0.5 rounded text-[10px] font-semibold">USDC</span>
        </div>
      </div>
    </div>
  )
}
