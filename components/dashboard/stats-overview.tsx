"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { useMarketStream } from "@/context/market-context"
import { getWalletBalanceCache } from "@/lib/wallet-cache"

const BTC_MOCK_PRICE = 68059.49

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
  const { overview } = useMarketStream()
  const walletCache = getWalletBalanceCache()

  const usdcVal = walletCache ? walletCache.usdcBalance : 0
  const btcVal = walletCache ? walletCache.btcBalance : 0
  const totalUsd = usdcVal + btcVal * BTC_MOCK_PRICE

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
            <h3 className="text-2xl font-bold mt-1.5">{!overview ? "..." : stat.value}</h3>
          </div>
          <div
            className={`flex items-center gap-1.5 text-xs mt-3 font-semibold ${stat.up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
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
          <h3 className="text-2xl font-bold mt-1.5">
            ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="flex items-center justify-between text-xs mt-3 font-medium text-muted-foreground">
          <span>{btcVal > 0 ? `Includes ${btcVal.toFixed(4)} BTC` : `USDC Ledger`}</span>
          <span className="bg-primary/15 text-primary px-2 py-0.5 rounded text-[10px] font-semibold">Active</span>
        </div>
      </div>
    </div>
  )
}
