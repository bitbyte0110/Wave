import { Client, IMessage } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { GATEWAY_URL } from "./auth"

export const MARKET_STREAMING_DIRECT_URL = "http://localhost:8081"

export interface PriceTickPayload {
  btcUsd: number
  usdcUsd: number
  btc24hPct: number
  timestampMs: number
}

export interface AuditNotificationPayload {
  txId: number
  userId: number
  status: string
  remark: string
  auditedAtMs: number
}

export type ConnectionStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED"

export interface MarketWebSocketManager {
  subscribePrices: (callback: (tick: PriceTickPayload) => void) => () => void
  subscribeUserNotifications: (userId: number, callback: (notification: AuditNotificationPayload) => void) => () => void
  onStatusChange: (callback: (status: ConnectionStatus) => void) => () => void
  disconnect: () => void
}

/**
 * Creates and manages a STOMP WebSocket connection to market-streaming
 * via Spring Cloud Gateway (http://localhost:8080/ws) with fallback to http://localhost:8081/ws.
 */
export function createMarketWebSocket(): MarketWebSocketManager {
  let status: ConnectionStatus = "CONNECTING"
  const statusListeners = new Set<(status: ConnectionStatus) => void>()
  const priceSubscribers = new Set<(tick: PriceTickPayload) => void>()
  const notificationSubscribers = new Map<number, Set<(n: AuditNotificationPayload) => void>>()

  function updateStatus(newStatus: ConnectionStatus) {
    status = newStatus
    statusListeners.forEach((listener) => listener(newStatus))
  }

  // Primary SockJS URL via Gateway, fallback direct to market-streaming
  const primaryWsUrl = `${GATEWAY_URL}/ws`
  const fallbackWsUrl = `${MARKET_STREAMING_DIRECT_URL}/ws`
  let currentWsUrl = primaryWsUrl

  const stompClient = new Client({
    webSocketFactory: () => new SockJS(currentWsUrl),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: () => {},
    onConnect: () => {
      updateStatus("CONNECTED")

      // Subscribe to price broadcasts
      stompClient.subscribe("/topic/prices", (message: IMessage) => {
        try {
          const payload: PriceTickPayload = JSON.parse(message.body)
          priceSubscribers.forEach((subscriber) => subscriber(payload))
        } catch (err) {
          console.error("Failed to parse STOMP price tick:", err)
        }
      })

      // Subscribe to user notification queues dynamically
      notificationSubscribers.forEach((callbacks, userId) => {
        stompClient.subscribe(`/queue/notifications/${userId}`, (message: IMessage) => {
          try {
            const payload: AuditNotificationPayload = JSON.parse(message.body)
            callbacks.forEach((cb) => cb(payload))
          } catch (err) {
            console.error(`Failed to parse user notification for user ${userId}:`, err)
          }
        })
      })
    },
    onDisconnect: () => {
      updateStatus("DISCONNECTED")
    },
    onStompError: (frame) => {
      console.warn("STOMP Error:", frame.headers["message"])
      updateStatus("DISCONNECTED")
    },
    onWebSocketClose: () => {
      updateStatus("CONNECTING")
      currentWsUrl = currentWsUrl === primaryWsUrl ? fallbackWsUrl : primaryWsUrl
    },
  })

  stompClient.activate()

  return {
    subscribePrices: (callback) => {
      priceSubscribers.add(callback)
      return () => {
        priceSubscribers.delete(callback)
      }
    },
    subscribeUserNotifications: (userId: number, callback) => {
      if (!notificationSubscribers.has(userId)) {
        notificationSubscribers.set(userId, new Set())
      }
      const userCallbacks = notificationSubscribers.get(userId)!
      userCallbacks.add(callback)

      if (stompClient.connected) {
        stompClient.subscribe(`/queue/notifications/${userId}`, (message: IMessage) => {
          try {
            const payload: AuditNotificationPayload = JSON.parse(message.body)
            userCallbacks.forEach((cb) => cb(payload))
          } catch (err) {
            console.error(`Failed to parse user notification for user ${userId}:`, err)
          }
        })
      }

      return () => {
        userCallbacks.delete(callback)
        if (userCallbacks.size === 0) {
          notificationSubscribers.delete(userId)
        }
      }
    },
    onStatusChange: (callback) => {
      statusListeners.add(callback)
      callback(status)
      return () => {
        statusListeners.delete(callback)
      }
    },
    disconnect: () => {
      priceSubscribers.clear()
      notificationSubscribers.clear()
      statusListeners.clear()
      stompClient.deactivate()
    },
  }
}
