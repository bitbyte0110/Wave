"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeftRight, ArrowDown, Lock, Loader2, ShieldCheck } from "lucide-react"

const LOCK_SECONDS = 5
const BASE_BTC_PRICE = 64850

// Simulate a slightly moving market price so each locked rate feels live.
function nextRate() {
  const drift = (Math.random() - 0.5) * 220
  return Math.round((BASE_BTC_PRICE + drift) * 100) / 100
}

export default function InstantSwap() {
  const [usdAmount, setUsdAmount] = useState("1000")
  const [lockedRate, setLockedRate] = useState(BASE_BTC_PRICE)
  const [secondsLeft, setSecondsLeft] = useState(LOCK_SECONDS)
  const [isSwapping, setIsSwapping] = useState(false)
  const [lastFilled, setLastFilled] = useState<{ usd: number; btc: number } | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown that re-locks a fresh guaranteed rate every 5 seconds.
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setLockedRate(nextRate())
          return LOCK_SECONDS
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const usdValue = Number.parseFloat(usdAmount) || 0
  const btcToReceive = usdValue > 0 ? usdValue / lockedRate : 0

  const handleConfirm = () => {
    if (usdValue <= 0 || isSwapping) return
    setIsSwapping(true)

    // Simulate the backend transaction / balance deduction.
    setTimeout(() => {
      const filledBtc = usdValue / lockedRate
      setIsSwapping(false)
      setLastFilled({ usd: usdValue, btc: filledBtc })

      // Notify the AI notification bell in the header with a real-time risk report.
      window.dispatchEvent(
        new CustomEvent("wave:risk-report", {
          detail: {
            usd: usdValue,
            btc: filledBtc,
            rate: lockedRate,
            time: new Date().toISOString(),
          },
        }),
      )
    }, 1100)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center mb-1">
          <div className="bg-emerald-100 rounded-full p-2 mr-3">
            <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Instant Swap</h2>
            <p className="text-gray-500 text-sm">Swap USD to BTC at a guaranteed rate</p>
          </div>
        </div>

        {/* You Pay */}
        <div className="mt-5 rounded-xl border bg-gray-50 p-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">You pay</label>
          <div className="flex items-center justify-between">
            <input
              type="number"
              min={0}
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-bold text-gray-900 focus:outline-none"
            />
            <div className="flex items-center gap-2 rounded-full bg-white border px-3 py-1.5 shrink-0">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                $
              </span>
              <span className="text-sm font-semibold text-gray-800">USD</span>
            </div>
          </div>
        </div>

        {/* Swap divider */}
        <div className="relative flex justify-center py-1">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gray-100" />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border bg-white">
            <ArrowDown className="h-4 w-4 text-emerald-600" />
          </div>
        </div>

        {/* You Receive */}
        <div className="rounded-xl border bg-gray-50 p-4">
          <label className="block text-xs font-medium text-gray-500 mb-2">You receive (estimated)</label>
          <div className="flex items-center justify-between">
            <span className="w-full text-2xl font-bold text-gray-900">{btcToReceive.toFixed(6)}</span>
            <div className="flex items-center gap-2 rounded-full bg-white border px-3 py-1.5 shrink-0">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                ₿
              </span>
              <span className="text-sm font-semibold text-gray-800">BTC</span>
            </div>
          </div>
        </div>

        {/* Guaranteed rate lock */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <Lock className="h-4 w-4" />
            <span className="font-medium">1 BTC = ${lockedRate.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700">Rate locked · {secondsLeft}s</span>
            <div className="h-6 w-6 relative">
              <svg viewBox="0 0 36 36" className="h-6 w-6 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#d1fae5" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 15}
                  strokeDashoffset={2 * Math.PI * 15 * (1 - secondsLeft / LOCK_SECONDS)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={usdValue <= 0 || isSwapping}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-md bg-emerald-600 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSwapping ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Executing swap...
            </>
          ) : (
            <>
              <ArrowLeftRight className="h-4 w-4" />
              Confirm Swap
            </>
          )}
        </button>

        {lastFilled && !isSwapping && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Swap complete — deducted ${lastFilled.usd.toLocaleString()} for {lastFilled.btc.toFixed(6)} BTC. Check the
              notification bell for your AI risk report.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
