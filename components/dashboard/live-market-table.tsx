"use client"

import { useEffect, useState } from "react"
import { Star, Wifi, WifiOff } from "lucide-react"
import { useMarketStream } from "@/context/market-context"

type Coin = {
  id: string
  rank: number
  name: string
  symbol: string
  icon: string
  iconClass: string
  price: number
  decimals: number
  change24h: number
  change7d: number
  marketCap: string
  volume: string
  supply: string
  favorite: boolean
}

const initialCoins: Coin[] = [
  {
    id: "btc",
    rank: 1,
    name: "Bitcoin",
    symbol: "BTC",
    icon: "B",
    iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    price: 68059.49,
    decimals: 2,
    change24h: 0.41,
    change7d: -4.0,
    marketCap: "$1,318,520,381,250",
    volume: "$25,123,456,789",
    supply: "19,720,000 BTC",
    favorite: true,
  },
  {
    id: "eth",
    rank: 2,
    name: "Ethereum",
    symbol: "ETH",
    icon: "E",
    iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    price: 3403.77,
    decimals: 2,
    change24h: 0.33,
    change7d: 20.65,
    marketCap: "$411,280,314,891",
    volume: "$15,987,654,321",
    supply: "120,200,000 ETH",
    favorite: true,
  },
  {
    id: "usdt",
    rank: 3,
    name: "Tether / USDC",
    symbol: "USDT",
    icon: "T",
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    price: 1.015,
    decimals: 4,
    change24h: 0.42,
    change7d: 0.0,
    marketCap: "$112,456,789,012",
    volume: "$45,678,901,234",
    supply: "112,456,789 USDT",
    favorite: false,
  },
  {
    id: "bnb",
    rank: 4,
    name: "BNB",
    symbol: "BNB",
    icon: "N",
    iconClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    price: 581.01,
    decimals: 2,
    change24h: 0.18,
    change7d: -3.62,
    marketCap: "$84,123,456,789",
    volume: "$2,123,456,789",
    supply: "145,533,345 BNB",
    favorite: false,
  },
  {
    id: "xrp",
    rank: 5,
    name: "XRP",
    symbol: "XRP",
    icon: "X",
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    price: 0.5853,
    decimals: 4,
    change24h: -0.12,
    change7d: -4.61,
    marketCap: "$32,567,890,123",
    volume: "$1,567,890,123",
    supply: "55,544,091,958 XRP",
    favorite: false,
  },
]

const tabs = ["All Cryptocurrencies", "Favorites", "Trending", "Top Gainers", "Top Decliners"] as const

function formatPrice(price: number, decimals: number) {
  return `$${price.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function formatPct(pct: number) {
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
}

export default function LiveMarketTable() {
  const { latestTick, connStatus, flashMap } = useMarketStream()
  const [coins, setCoins] = useState<Coin[]>(initialCoins)
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All Cryptocurrencies")

  // Sync coins with live ticks from MarketStreamContext
  useEffect(() => {
    if (!latestTick || !latestTick.btcUsd) return

    setCoins((prev) =>
      prev.map((c) => {
        if (c.id === "btc") {
          return {
            ...c,
            price: latestTick.btcUsd,
            change24h: latestTick.btc24hPct ?? c.change24h,
          }
        }
        if (c.id === "usdt" && latestTick.usdcUsd) {
          return {
            ...c,
            price: latestTick.usdcUsd,
          }
        }
        return c
      })
    )
  }, [latestTick])

  const toggleFavorite = (id: string) => {
    setCoins((prev) => prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)))
  }

  const visibleCoins = coins.filter((c) => {
    switch (activeTab) {
      case "Favorites":
        return c.favorite
      case "Trending":
        return Math.abs(c.change7d) > 4
      case "Top Gainers":
        return c.change24h > 0
      case "Top Decliners":
        return c.change24h < 0
      default:
        return true
    }
  })

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
      {/* Header bar with filters & live connection indicator */}
      <div className="border-b border-border px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${activeTab === tab
                  ? "font-semibold bg-muted text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Live Prices Status Badge */}
        <div className="flex items-center space-x-2">
          {connStatus === "CONNECTED" ? (
            <span className="inline-flex items-center space-x-1.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              <Wifi className="h-3 w-3 animate-pulse" />
              <span>LIVE PRICES</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
              <WifiOff className="h-3 w-3" />
              <span>RECONNECTING...</span>
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-6 text-center w-12" />
              <th className="py-4 px-4 w-12 text-center">#</th>
              <th className="py-4 px-6">Name</th>
              <th className="py-4 px-6 text-right">Price</th>
              <th className="py-4 px-6 text-right">24h %</th>
              <th className="py-4 px-6 text-right">7d %</th>
              <th className="py-4 px-6 text-right">Market Cap</th>
              <th className="py-4 px-6 text-right">Volume(24h)</th>
              <th className="py-4 px-6 text-right">Circulating Supply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {visibleCoins.map((coin) => (
              <tr key={coin.id} className="hover:bg-muted/40 transition-colors">
                <td className="py-4 px-6 text-center">
                  <button
                    onClick={() => toggleFavorite(coin.id)}
                    className={`transition hover:scale-110 ${coin.favorite ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-500"
                      }`}
                    aria-label={coin.favorite ? `Remove ${coin.name} from favorites` : `Add ${coin.name} to favorites`}
                  >
                    <Star className="h-[18px] w-[18px]" fill={coin.favorite ? "currentColor" : "none"} />
                  </button>
                </td>
                <td className="py-4 px-4 text-center font-semibold text-muted-foreground">{coin.rank}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${coin.iconClass}`}
                    >
                      {coin.icon}
                    </div>
                    <div>
                      <span className="font-bold">{coin.name}</span>
                      <span className="text-xs text-muted-foreground ml-1.5 uppercase font-bold">{coin.symbol}</span>
                    </div>
                  </div>
                </td>
                <td
                  className={`py-4 px-6 text-right font-bold tracking-tight rounded transition-all duration-300 ${flashMap[coin.id] === "up"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold"
                      : flashMap[coin.id] === "down"
                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold"
                        : ""
                    }`}
                >
                  {formatPrice(coin.price, coin.decimals)}
                </td>
                <td
                  className={`py-4 px-6 text-right font-semibold ${coin.change24h >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                >
                  {formatPct(coin.change24h)}
                </td>
                <td
                  className={`py-4 px-6 text-right font-semibold ${coin.change7d >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                >
                  {formatPct(coin.change7d)}
                </td>
                <td className="py-4 px-6 text-right text-muted-foreground">{coin.marketCap}</td>
                <td className="py-4 px-6 text-right text-muted-foreground">{coin.volume}</td>
                <td className="py-4 px-6 text-right text-muted-foreground font-mono text-xs">{coin.supply}</td>
              </tr>
            ))}
            {visibleCoins.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-muted-foreground text-sm">
                  No cryptocurrencies match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
