"use client"

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { GATEWAY_URL, getAuthUser } from "@/lib/auth"
import {
  createMarketWebSocket,
  ConnectionStatus,
  PriceTickPayload,
  AuditNotificationPayload,
} from "@/lib/market-websocket"

export interface MarketOverviewData {
  globalMarketCapUsd: number
  totalVolume24hUsd: number
  btcDominancePct: number
  btcUsd: number
  btc24hPct: number
  cachedAtMs: number
}

interface MarketContextType {
  overview: MarketOverviewData | null
  latestTick: PriceTickPayload | null
  connStatus: ConnectionStatus
  flashMap: Record<string, "up" | "down" | undefined>
  notifications: AuditNotificationPayload[]
  clearNotifications: () => void
  refreshOverview: () => Promise<void>
}

const MarketContext = createContext<MarketContextType | null>(null)

const OVERVIEW_CACHE_KEY = "wave_market_overview_cache"
const TICK_CACHE_KEY = "wave_market_tick_cache"

function getCachedOverview(): MarketOverviewData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(OVERVIEW_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getCachedTick(): PriceTickPayload | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(TICK_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function MarketStreamProvider({ children }: { children: React.ReactNode }) {
  const [overview, setOverview] = useState<MarketOverviewData | null>(() => getCachedOverview())
  const [latestTick, setLatestTick] = useState<PriceTickPayload | null>(() => getCachedTick())
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("CONNECTING")
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down" | undefined>>({})
  const [notifications, setNotifications] = useState<AuditNotificationPayload[]>([])

  const pricesRef = useRef<Record<string, number>>({})
  const flashTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const triggerFlash = useCallback((coinId: string, direction: "up" | "down") => {
    setFlashMap((prev) => ({ ...prev, [coinId]: direction }))
    if (flashTimeouts.current[coinId]) {
      clearTimeout(flashTimeouts.current[coinId])
    }
    flashTimeouts.current[coinId] = setTimeout(() => {
      setFlashMap((prev) => ({ ...prev, [coinId]: undefined }))
    }, 800)
  }, [])

  // 1. REST API Overview & Tick Fetching
  const refreshOverview = useCallback(async () => {
    const primaryUrl = `${GATEWAY_URL}/api/v1/market/overview`
    const fallbackUrl = "http://localhost:8081/api/v1/market/overview"

    try {
      let res = await fetch(primaryUrl).catch(() => null)
      if (!res || !res.ok) {
        res = await fetch(fallbackUrl).catch(() => null)
      }

      if (res && res.ok) {
        const data = await res.json()
        const parsed: MarketOverviewData = {
          globalMarketCapUsd: Number(data.globalMarketCapUsd || 0),
          totalVolume24hUsd: Number(data.totalVolume24hUsd || 0),
          btcDominancePct: Number(data.btcDominancePct || 0),
          btcUsd: Number(data.btcUsd || 0),
          btc24hPct: Number(data.btc24hPct || 0),
          cachedAtMs: Number(data.cachedAtMs || Date.now()),
        }
        setOverview(parsed)
        if (typeof window !== "undefined") {
          sessionStorage.setItem(OVERVIEW_CACHE_KEY, JSON.stringify(parsed))
        }
      }
    } catch (err) {
      console.warn("Failed to fetch market overview:", err)
    }
  }, [])

  const seedInitialTick = useCallback(async () => {
    const primaryUrl = `${GATEWAY_URL}/api/v1/market/price/tick`
    const fallbackUrl = "http://localhost:8081/api/v1/market/price/tick"

    try {
      let res = await fetch(primaryUrl).catch(() => null)
      if (!res || !res.ok) {
        res = await fetch(fallbackUrl).catch(() => null)
      }

      if (res && res.ok) {
        const tick: PriceTickPayload = await res.json()
        if (tick.btcUsd && tick.btcUsd > 0) {
          setLatestTick(tick)
          pricesRef.current.btc = tick.btcUsd
          if (tick.usdcUsd) pricesRef.current.usdt = tick.usdcUsd
          if (typeof window !== "undefined") {
            sessionStorage.setItem(TICK_CACHE_KEY, JSON.stringify(tick))
          }
        }
      }
    } catch (err) {
      console.warn("Failed to seed initial price tick:", err)
    }
  }, [])

  // 2. Global Persistent STOMP WebSocket Connection (Single lifecycle across layout)
  useEffect(() => {
    refreshOverview()
    seedInitialTick()

    const overviewInterval = setInterval(refreshOverview, 60000)

    const wsManager = createMarketWebSocket()

    const unsubStatus = wsManager.onStatusChange((status) => {
      setConnStatus(status)
    })

    const unsubPrices = wsManager.subscribePrices((tick) => {
      if (!tick.btcUsd) return

      setLatestTick(tick)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(TICK_CACHE_KEY, JSON.stringify(tick))
      }

      // BTC Price Flash calculation
      const oldBtc = pricesRef.current.btc || tick.btcUsd
      if (tick.btcUsd !== oldBtc) {
        triggerFlash("btc", tick.btcUsd > oldBtc ? "up" : "down")
        pricesRef.current.btc = tick.btcUsd
      }

      // USDC Price Flash calculation
      if (tick.usdcUsd) {
        const oldUsdc = pricesRef.current.usdt || tick.usdcUsd
        if (tick.usdcUsd !== oldUsdc) {
          triggerFlash("usdt", tick.usdcUsd > oldUsdc ? "up" : "down")
          pricesRef.current.usdt = tick.usdcUsd
        }
      }
    })

    const user = getAuthUser()
    const activeUserId = user?.userId || 42

    const unsubNotifs = wsManager.subscribeUserNotifications(activeUserId, (notif) => {
      setNotifications((prev) => [notif, ...prev])
    })

    // Also subscribe to 42 if activeUserId is different
    let unsubNotifs42 = () => {}
    if (activeUserId !== 42) {
      unsubNotifs42 = wsManager.subscribeUserNotifications(42, (notif) => {
        setNotifications((prev) => [notif, ...prev])
      })
    }

    return () => {
      clearInterval(overviewInterval)
      unsubPrices()
      unsubNotifs()
      unsubNotifs42()
      unsubStatus()
      wsManager.disconnect()
      Object.values(flashTimeouts.current).forEach(clearTimeout)
    }
  }, [refreshOverview, seedInitialTick, triggerFlash])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <MarketContext.Provider
      value={{
        overview,
        latestTick,
        connStatus,
        flashMap,
        notifications,
        clearNotifications,
        refreshOverview,
      }}
    >
      {children}
    </MarketContext.Provider>
  )
}

export function useMarketStream() {
  const context = useContext(MarketContext)
  if (!context) {
    throw new Error("useMarketStream must be used within a MarketStreamProvider")
  }
  return context
}
