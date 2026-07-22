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

export type ConnectionStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED"

export interface MarketWebSocketManager {
  subscribePrices: (callback: (tick: PriceTickPayload) => void) => () => void
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
    debug: (str) => {
      if (process.env.NODE_ENV === "development") {
        // console.log("[STOMP]", str)
      }
    },
    onConnect: () => {
      // console.log("STOMP Connected to:", currentWsUrl)
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
      // Toggle fallback URL on disconnect/reconnect attempt
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
    onStatusChange: (callback) => {
      statusListeners.add(callback)
      callback(status) // Immediate initial status call
      return () => {
        statusListeners.delete(callback)
      }
    },
    disconnect: () => {
      priceSubscribers.clear()
      statusListeners.clear()
      stompClient.deactivate()
    },
  }
}
