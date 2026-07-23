"use client"

import { useEffect, useState, useCallback } from "react"
import { GATEWAY_URL, getAuthUser } from "@/lib/auth"
import { getWalletBalanceCache, setWalletBalanceCache, CachedWalletBalance } from "@/lib/wallet-cache"

const BTC_MOCK_PRICE = 68059.49

export default function AssetDistribution() {
  const [showPercentage, setShowPercentage] = useState(true)
  const [balanceData, setBalanceData] = useState<CachedWalletBalance | null>(() => getWalletBalanceCache())
  const [isLoading, setIsLoading] = useState(false)

  const fetchBalance = useCallback(async () => {
    setIsLoading(true)
    const user = getAuthUser()
    const userId = user?.userId || 42

    const primaryUrl = `${GATEWAY_URL}/api/v1/wallet/balance/${userId}`
    const fallbackUrl = `http://localhost:8084/api/v1/wallet/balance/${userId}`

    try {
      let res = await fetch(primaryUrl).catch(() => null)
      if (!res || !res.ok) {
        res = await fetch(fallbackUrl).catch(() => null)
      }

      if (res && res.ok) {
        const data = await res.json()
        const parsed = {
          userId: Number(data.userId || userId),
          usdcBalance: Number(data.usdcBalance || 0),
          btcBalance: Number(data.btcBalance || 0),
        }
        setBalanceData({ ...parsed, cachedAt: Date.now() })
        setWalletBalanceCache(parsed)
      }
    } catch (err) {
      console.warn("Failed to fetch asset distribution balance:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBalance()

    window.addEventListener("wave:balance-update", fetchBalance)
    window.addEventListener("wave:risk-report", fetchBalance)

    return () => {
      window.removeEventListener("wave:balance-update", fetchBalance)
      window.removeEventListener("wave:risk-report", fetchBalance)
    }
  }, [fetchBalance])

  const usdcVal = balanceData ? balanceData.usdcBalance : 0
  const btcVal = balanceData ? balanceData.btcBalance : 0
  const btcUsdVal = btcVal * BTC_MOCK_PRICE
  const totalUsd = usdcVal + btcUsdVal

  const usdcPct = totalUsd > 0 ? (usdcVal / totalUsd) * 100 : 50
  const btcPct = totalUsd > 0 ? (btcUsdVal / totalUsd) * 100 : 50

  // SVG Donut circumference calculation for r=40: 2 * PI * 40 ≈ 251.2
  const circumference = 251.2
  const usdcDash = (usdcPct / 100) * circumference
  const btcDash = (btcPct / 100) * circumference
  const btcOffset = -usdcDash

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-foreground">Asset Allocation</h2>
        <button
          className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
          onClick={() => setShowPercentage(!showPercentage)}
        >
          {showPercentage ? "Show Values" : "Show %"}
        </button>
      </div>

      <div className="my-3">
        <div className="relative h-44 w-44 mx-auto flex items-center justify-center">
          {/* SVG Donut Chart */}
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {/* Background ring */}
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />

            {/* USDC Segment (Green) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="16"
              strokeDasharray={`${usdcDash} ${circumference}`}
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />

            {/* BTC Segment (Orange/Amber) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="16"
              strokeDasharray={`${btcDash} ${circumference}`}
              strokeDashoffset={`${btcOffset}`}
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease" }}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Value</div>
            <div className="text-lg font-extrabold text-foreground tracking-tight">
              {!balanceData && isLoading ? "..." : `$${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Breakdown List */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-emerald-500 mr-2 border border-emerald-400/30" />
            <span className="font-semibold text-foreground">USD Coin (USDC)</span>
          </div>
          <div className="font-mono font-bold text-foreground">
            {showPercentage
              ? `${usdcPct.toFixed(1)}%`
              : `$${usdcVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-amber-500 mr-2 border border-amber-400/30" />
            <span className="font-semibold text-foreground">Bitcoin (BTC)</span>
          </div>
          <div className="font-mono font-bold text-foreground">
            {showPercentage
              ? `${btcPct.toFixed(1)}%`
              : `$${btcUsdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>
    </div>
  )
}
