"use client"

import { useEffect, useState, useCallback } from "react"
import { Eye, EyeOff, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { GATEWAY_URL, getAuthUser } from "@/lib/auth"
import { getWalletBalanceCache, setWalletBalanceCache, CachedWalletBalance } from "@/lib/wallet-cache"

const BTC_MOCK_PRICE = 68059.49

export default function WalletBalance() {
  const [showBalance, setShowBalance] = useState(true)
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
      console.warn("Failed to fetch wallet balance:", err)
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
  const totalUsd = usdcVal + btcVal * BTC_MOCK_PRICE

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground">Wallet Balance</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            aria-label={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            onClick={fetchBalance}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            title="Refresh Balance"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-muted/40 border border-border">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Portfolio Balance</div>
        <div className="text-3xl font-extrabold text-foreground mt-1 tracking-tight">
          {!showBalance
            ? "••••••••"
            : !balanceData && isLoading
            ? "..."
            : `$${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>

        {totalUsd > 0 ? (
          <div className="flex items-center mt-2 text-xs font-semibold text-emerald-500">
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            <span>+$240.14 (+2.45%) past 24h</span>
          </div>
        ) : (
          <div className="flex items-center mt-2 text-xs font-semibold text-rose-500">
            <TrendingDown className="h-3.5 w-3.5 mr-1" />
            <span>-$0.00 (-0.00%) past 24h</span>
          </div>
        )}
      </div>

      <div className="flex justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">Your Assets</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] text-muted-foreground border-b border-border font-bold uppercase tracking-wider">
              <th className="pb-2">ASSET</th>
              <th className="pb-2 text-right">BALANCE</th>
              <th className="pb-2 text-right">VALUE (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {/* USDC Row */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3">
                <div className="flex items-center">
                  <div className="bg-emerald-500/20 text-emerald-400 rounded-full h-8 w-8 flex items-center justify-center mr-3 font-bold border border-emerald-500/30">
                    $
                  </div>
                  <div>
                    <div className="font-bold text-foreground">USD Coin</div>
                    <div className="text-xs text-muted-foreground font-semibold">USDC</div>
                  </div>
                </div>
              </td>
              <td className="py-3 text-right">
                <div className="font-mono font-bold text-foreground">
                  {!showBalance ? "•••••" : !balanceData && isLoading ? "..." : usdcVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground">USDC</div>
              </td>
              <td className="py-3 text-right font-mono font-bold text-foreground">
                {!showBalance ? "•••••" : !balanceData && isLoading ? "..." : `$${usdcVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </td>
            </tr>

            {/* BTC Row */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3">
                <div className="flex items-center">
                  <div className="bg-amber-500/20 text-amber-400 rounded-full h-8 w-8 flex items-center justify-center mr-3 font-bold border border-amber-500/30">
                    ₿
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Bitcoin</div>
                    <div className="text-xs text-muted-foreground font-semibold">BTC</div>
                  </div>
                </div>
              </td>
              <td className="py-3 text-right">
                <div className="font-mono font-bold text-foreground">
                  {!showBalance ? "•••••" : !balanceData && isLoading ? "..." : btcVal.toFixed(6)}
                </div>
                <div className="text-xs text-muted-foreground">BTC</div>
              </td>
              <td className="py-3 text-right font-mono font-bold text-foreground">
                {!showBalance ? "•••••" : !balanceData && isLoading ? "..." : `$${(btcVal * BTC_MOCK_PRICE).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
