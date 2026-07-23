"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock } from "lucide-react"
import { GATEWAY_URL, getAuthUser } from "@/lib/auth"
import { useMarketStream } from "@/context/market-context"
import {
  getTransactionHistoryCache,
  setTransactionHistoryCache,
  CachedTransaction,
} from "@/lib/wallet-cache"

export default function RecentActivity() {
  const { notifications } = useMarketStream()
  const [activities, setActivities] = useState<CachedTransaction[]>(() => {
    const cached = getTransactionHistoryCache()
    return cached ? cached.slice(0, 3) : []
  })

  const fetchRecent = useCallback(async () => {
    const user = getAuthUser()
    const userId = user?.userId || 42

    const primaryUrl = `${GATEWAY_URL}/api/v1/wallet/transactions/${userId}`
    const fallbackUrl = `http://localhost:8084/api/v1/wallet/transactions/${userId}`

    try {
      let res = await fetch(primaryUrl).catch(() => null)
      if (!res || !res.ok) {
        res = await fetch(fallbackUrl).catch(() => null)
      }

      if (res && res.ok) {
        const rawData = await res.json()
        const parsed: CachedTransaction[] = (rawData || []).map((tx: any) => ({
          id: Number(tx.id),
          type: (tx.type || "SWAP").toUpperCase(),
          assetTraded: String(tx.assetTraded || "USDC/BTC"),
          amount: Number(tx.amount || 0),
          aiAuditRemark: tx.aiAuditRemark || null,
          createdAt: tx.createdAt || new Date().toISOString(),
        }))

        setTransactionHistoryCache(parsed)
        setActivities(parsed.slice(0, 3))
      }
    } catch (err) {
      console.warn("Failed to fetch recent activity:", err)
    }
  }, [])

  useEffect(() => {
    fetchRecent()

    window.addEventListener("wave:balance-update", fetchRecent)
    window.addEventListener("wave:risk-report", fetchRecent)

    return () => {
      window.removeEventListener("wave:balance-update", fetchRecent)
      window.removeEventListener("wave:risk-report", fetchRecent)
    }
  }, [fetchRecent])

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      fetchRecent()
    }
  }, [notifications, fetchRecent])

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>

      <div className="space-y-3">
        {activities.map((activity) => {
          const isDeposit = activity.type === "DEPOSIT"
          const isSwap = activity.type === "SWAP"

          const title = isSwap
            ? `Swapped ${activity.assetTraded.replace("/", " → ")}`
            : `${isDeposit ? "Received" : "Sent"} ${activity.assetTraded}`

          const formattedAmount = isSwap
            ? `${activity.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}`
            : `${isDeposit ? "+" : "-"}${activity.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${activity.assetTraded}`

          const timeFormatted = activity.createdAt
            ? new Date(activity.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now"

          return (
            <div
              key={activity.id}
              className="flex items-center justify-between p-2.5 hover:bg-muted/50 rounded-xl transition-colors border border-transparent hover:border-border"
            >
              <div className="flex items-center">
                <div
                  className={`rounded-full p-2 mr-3 border ${
                    isDeposit
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : isSwap
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  }`}
                >
                  {isDeposit ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : isSwap ? (
                    <ArrowLeftRight className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{title}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center mt-0.5 font-medium">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground/70" />
                    {timeFormatted}
                  </div>
                </div>
              </div>
              <div
                className={`text-xs font-mono font-bold ${
                  isDeposit ? "text-emerald-500" : isSwap ? "text-foreground" : "text-rose-500"
                }`}
              >
                {formattedAmount}
              </div>
            </div>
          )
        })}

        {activities.length === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground">No recent activity recorded yet.</div>
        )}
      </div>
    </div>
  )
}
