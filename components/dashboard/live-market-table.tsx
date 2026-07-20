"use client"

import { useEffect, useRef, useState } from "react"
import { Star } from "lucide-react"

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
    iconClass: "bg-amber-500/10 text-amber-600",
    price: 67450,
    decimals: 2,
    change24h: 2.15,
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
    iconClass: "bg-indigo-500/10 text-indigo-600",
    price: 3420.5,
    decimals: 2,
    change24h: -1.42,
    change7d: 20.65,
    marketCap: "$411,280,314,891",
    volume: "$15,987,654,321",
    supply: "120,200,000 ETH",
    favorite: true,
  },
  {
    id: "usdt",
    rank: 3,
    name: "Tether",
    symbol: "USDT",
    icon: "T",
    iconClass: "bg-emerald-500/10 text-emerald-600",
    price: 1.0001,
    decimals: 4,
    change24h: 0.01,
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
    iconClass: "bg-yellow-500/10 text-yellow-600",
    price: 578.4,
    decimals: 2,
    change24h: -0.45,
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
    iconClass: "bg-blue-500/10 text-blue-600",
    price: 0.5924,
    decimals: 4,
    change24h: -2.65,
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
  return `${pct >= 0 ? "+" : "-"}${Math.abs(pct).toFixed(2)}%`
}

export default function LiveMarketTable() {
  const [coins, setCoins] = useState<Coin[]>(initialCoins)
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All Cryptocurrencies")
  const [flash, setFlash] = useState<Record<string, "up" | "down" | undefined>>({})
  const flashTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Simulate real-time websocket price broadcasts
  useEffect(() => {
    const interval = setInterval(() => {
      setCoins((prev) => {
        const idx = Math.floor(Math.random() * prev.length)
        const target = prev[idx]
        const changePercent = (Math.random() * 0.2 + 0.05) / 100
        const isUp = Math.random() > 0.48
        const diff = target.price * changePercent
        const newPrice = isUp ? target.price + diff : target.price - diff
        const newChange = isUp ? Math.random() * 0.4 + 0.1 : -(Math.random() * 0.4 + 0.1)

        // Trigger flash
        setFlash((f) => ({ ...f, [target.id]: isUp ? "up" : "down" }))
        clearTimeout(flashTimeouts.current[target.id])
        flashTimeouts.current[target.id] = setTimeout(() => {
          setFlash((f) => ({ ...f, [target.id]: undefined }))
        }, 1200)

        const next = [...prev]
        next[idx] = { ...target, price: newPrice, change24h: newChange }
        return next
      })
    }, 1500)

    return () => {
      clearInterval(interval)
      Object.values(flashTimeouts.current).forEach(clearTimeout)
    }
  }, [])

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
      {/* Tabs header */}
      <div className="border-b border-border px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                activeTab === tab
                  ? "font-semibold bg-muted text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
          Live Prices
        </span>
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
                    className={`transition hover:scale-110 ${
                      coin.favorite ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-500"
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
                  className={`py-4 px-6 text-right font-bold tracking-tight ${
                    flash[coin.id] === "up" ? "price-up" : flash[coin.id] === "down" ? "price-down" : ""
                  }`}
                >
                  {formatPrice(coin.price, coin.decimals)}
                </td>
                <td
                  className={`py-4 px-6 text-right font-semibold ${
                    coin.change24h >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {formatPct(coin.change24h)}
                </td>
                <td
                  className={`py-4 px-6 text-right font-semibold ${
                    coin.change7d >= 0 ? "text-emerald-600" : "text-rose-600"
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
