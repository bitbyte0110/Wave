/**
 * Helper utility for session caching of user wallet balances and transaction history.
 * Prevents initial render flashes when switching between Dashboard, Wallet, and Swap views.
 */

export interface CachedWalletBalance {
  userId: number
  usdcBalance: number
  btcBalance: number
  cachedAt: number
}

export interface CachedTransaction {
  id: number
  type: "DEPOSIT" | "WITHDRAW" | "SWAP"
  assetTraded: string
  amount: number
  aiAuditRemark?: string | null
  createdAt: string
}

let inMemoryBalanceCache: CachedWalletBalance | null = null
let inMemoryTxCache: CachedTransaction[] | null = null

export function getWalletBalanceCache(): CachedWalletBalance | null {
  if (inMemoryBalanceCache) {
    return inMemoryBalanceCache
  }

  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem("wave_wallet_balance_cache")
    if (raw) {
      const parsed: CachedWalletBalance = JSON.parse(raw)
      inMemoryBalanceCache = parsed
      return parsed
    }
  } catch (err) {
    console.warn("Failed to read wallet balance cache from sessionStorage:", err)
  }

  return null
}

export function setWalletBalanceCache(data: { userId: number; usdcBalance: number; btcBalance: number }) {
  const cacheObj: CachedWalletBalance = {
    userId: data.userId,
    usdcBalance: data.usdcBalance,
    btcBalance: data.btcBalance,
    cachedAt: Date.now(),
  }

  inMemoryBalanceCache = cacheObj

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("wave_wallet_balance_cache", JSON.stringify(cacheObj))
    } catch (err) {
      console.warn("Failed to save wallet balance cache to sessionStorage:", err)
    }
  }
}

export function getTransactionHistoryCache(): CachedTransaction[] | null {
  if (inMemoryTxCache) {
    return inMemoryTxCache
  }

  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem("wave_tx_history_cache")
    if (raw) {
      const parsed: CachedTransaction[] = JSON.parse(raw)
      inMemoryTxCache = parsed
      return parsed
    }
  } catch (err) {
    console.warn("Failed to read transaction history cache from sessionStorage:", err)
  }

  return null
}

export function setTransactionHistoryCache(txs: CachedTransaction[]) {
  inMemoryTxCache = txs

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("wave_tx_history_cache", JSON.stringify(txs))
    } catch (err) {
      console.warn("Failed to save transaction history cache to sessionStorage:", err)
    }
  }
}
