"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Search, ArrowLeftRight, Sparkles } from "lucide-react"
import { GATEWAY_URL, getAuthUser } from "@/lib/auth"
import { useMarketStream } from "@/context/market-context"
import {
  getTransactionHistoryCache,
  setTransactionHistoryCache,
  CachedTransaction,
} from "@/lib/wallet-cache"

export type BackendTransaction = CachedTransaction

export default function TransactionHistory() {
  const { notifications } = useMarketStream()
  const [filter, setFilter] = useState<"all" | "swap" | "deposit" | "withdraw">("all")
  const [transactions, setTransactions] = useState<BackendTransaction[]>(() => getTransactionHistoryCache() || [])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
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
        const parsed: BackendTransaction[] = (rawData || []).map((tx: any) => ({
          id: Number(tx.id),
          type: (tx.type || "SWAP").toUpperCase(),
          assetTraded: String(tx.assetTraded || "USDC/BTC"),
          amount: Number(tx.amount || 0),
          aiAuditRemark: tx.aiAuditRemark || null,
          createdAt: tx.createdAt || new Date().toISOString(),
        }))

        setTransactions(parsed)
        setTransactionHistoryCache(parsed)
      }
    } catch (err) {
      console.warn("Failed to fetch transaction history:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()

    window.addEventListener("wave:balance-update", fetchTransactions)
    window.addEventListener("wave:risk-report", fetchTransactions)

    return () => {
      window.removeEventListener("wave:balance-update", fetchTransactions)
      window.removeEventListener("wave:risk-report", fetchTransactions)
    }
  }, [fetchTransactions])

  // Re-fetch transactions whenever AI Audit notification finishes in MarketStreamContext
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      fetchTransactions()
    }
  }, [notifications, fetchTransactions])

  // Filtering by tab & search query
  const filteredTransactions = transactions.filter((tx) => {
    const txType = tx.type.toLowerCase()
    if (filter !== "all" && txType !== filter) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchAsset = tx.assetTraded.toLowerCase().includes(q)
      const matchType = tx.type.toLowerCase().includes(q)
      const matchRemark = tx.aiAuditRemark ? tx.aiAuditRemark.toLowerCase().includes(q) : false
      return matchAsset || matchType || matchRemark
    }

    return true
  })

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span>Transaction History</span>
          <span className="text-xs font-normal text-muted-foreground">({transactions.length} records)</span>
        </h2>
        <button
          onClick={fetchTransactions}
          disabled={isLoading}
          className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
          title="Refresh Ledger"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between mb-4 space-y-2 sm:space-y-0 gap-2">
        <div className="flex space-x-1.5">
          {(["all", "swap", "deposit", "withdraw"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search asset, type or remark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500"
            />
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border font-semibold uppercase tracking-wider">
              <th className="py-3 px-3">Date & Time</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Route</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-right">AI Audit Remark</th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {filteredTransactions.map((tx) => {
              const isSwap = tx.type === "SWAP"
              const isDeposit = tx.type === "DEPOSIT"
              const routeLabel = isSwap
                ? tx.assetTraded.replace("/", " → ")
                : `${tx.assetTraded} ${isDeposit ? "Deposit" : "Withdrawal"}`

              const formattedAmount = isSwap
                ? `${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${tx.assetTraded.split("/")[0]}`
                : `${isDeposit ? "+" : "-"}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${tx.assetTraded}`

              const displayRemark =
                tx.aiAuditRemark || (isDeposit ? "Auto-Approved (Deposit)" : isSwap ? "Low Risk (Verified)" : "System Cleared")

              return (
                <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-medium text-foreground">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "Just now"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : ""}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    {isSwap ? (
                      <div className="flex items-center text-emerald-500 font-medium">
                        <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
                        <span>Swap</span>
                      </div>
                    ) : isDeposit ? (
                      <div className="flex items-center text-emerald-500 font-medium">
                        <ArrowDownLeft className="h-3.5 w-3.5 mr-1" />
                        <span>Deposit</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-rose-500 font-medium">
                        <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                        <span>Withdraw</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-foreground">{routeLabel}</div>
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono font-bold text-foreground">
                    {formattedAmount}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span
                      className={`inline-flex items-center space-x-1 text-[10px] border px-2 py-0.5 rounded-md font-medium ${
                        displayRemark.toLowerCase().includes("elevated") || displayRemark.toLowerCase().includes("high")
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : displayRemark.toLowerCase().includes("moderate")
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }`}
                    >
                      <Sparkles className="h-3 w-3 shrink-0 text-emerald-400" />
                      <span>{displayRemark}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      COMPLETED
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!isLoading && filteredTransactions.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-xs">
          No transaction history records match your search query.
        </div>
      )}
    </div>
  )
}
