"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ArrowLeftRight, ArrowDown, Lock, Loader2, ShieldCheck, AlertCircle, X, CheckCircle2 } from "lucide-react"
import { GATEWAY_URL, getAuthUser, fetchWithAuth } from "@/lib/auth"

const MODAL_LOCK_SECONDS = 10
const DEFAULT_BTC_PRICE = 68059.49

export default function InstantSwap() {
  const [fromAsset, setFromAsset] = useState<"USDC" | "BTC">("USDC")
  const [toAsset, setToAsset] = useState<"USDC" | "BTC">("BTC")
  const [fromAmount, setFromAmount] = useState("1000")
  const [currentRate, setCurrentRate] = useState(DEFAULT_BTC_PRICE)

  // Confirmation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSecondsLeft, setModalSecondsLeft] = useState(MODAL_LOCK_SECONDS)
  const [lockedRateInModal, setLockedRateInModal] = useState(DEFAULT_BTC_PRICE)
  const [isSwapping, setIsSwapping] = useState(false)
  const [apiError, setApiError] = useState("")
  const [lastFilled, setLastFilled] = useState<{ from: string; fromAmt: number; to: string; toAmt: number } | null>(null)

  const modalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestPriceRef = useRef(DEFAULT_BTC_PRICE)

  // Fetch live market price
  const fetchLiveRate = useCallback(async () => {
    const primaryUrl = `${GATEWAY_URL}/api/v1/market/price/tick`
    const fallbackUrl = "http://localhost:8081/api/v1/market/price/tick"

    try {
      let res = await fetch(primaryUrl).catch(() => null)
      if (!res || !res.ok) {
        res = await fetch(fallbackUrl).catch(() => null)
      }

      if (res && res.ok) {
        const tick = await res.json()
        if (tick.btcUsd && tick.btcUsd > 0) {
          const price = Number(tick.btcUsd)
          latestPriceRef.current = price
          setCurrentRate(price)
        }
      }
    } catch (err) {
      console.warn("Failed to fetch live price tick for swap:", err)
    }
  }, [])

  useEffect(() => {
    fetchLiveRate()
  }, [fetchLiveRate])

  const parsedFromAmount = Number.parseFloat(fromAmount) || 0

  // Calculate receive amount based on active rate
  const calculateOutput = (amount: number, rate: number) => {
    if (amount <= 0) return 0
    return fromAsset === "USDC" ? amount / rate : amount * rate
  }

  const calculatedToAmount = calculateOutput(parsedFromAmount, currentRate)

  const handleFlipAssets = () => {
    setFromAsset(toAsset)
    setToAsset(fromAsset)
  }

  // Open 10-Second Rate Lock Confirmation Modal
  const handleOpenPreviewModal = () => {
    if (parsedFromAmount <= 0) return
    setApiError("")
    fetchLiveRate()
    setLockedRateInModal(latestPriceRef.current)
    setModalSecondsLeft(MODAL_LOCK_SECONDS)
    setIsModalOpen(true)

    if (modalIntervalRef.current) clearInterval(modalIntervalRef.current)

    modalIntervalRef.current = setInterval(() => {
      setModalSecondsLeft((prev) => {
        if (prev <= 1) {
          if (modalIntervalRef.current) clearInterval(modalIntervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleRefreshModalRate = () => {
    fetchLiveRate()
    setLockedRateInModal(latestPriceRef.current)
    setModalSecondsLeft(MODAL_LOCK_SECONDS)

    if (modalIntervalRef.current) clearInterval(modalIntervalRef.current)
    modalIntervalRef.current = setInterval(() => {
      setModalSecondsLeft((prev) => {
        if (prev <= 1) {
          if (modalIntervalRef.current) clearInterval(modalIntervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleCloseModal = () => {
    if (modalIntervalRef.current) clearInterval(modalIntervalRef.current)
    setIsModalOpen(false)
  }

  // Execute Swap API call
  const handleConfirmSwap = async () => {
    if (parsedFromAmount <= 0 || isSwapping || modalSecondsLeft <= 0) return
    setIsSwapping(true)
    setApiError("")

    const user = getAuthUser()
    const userId = user?.userId || 42
    const idempotencyKey = crypto.randomUUID()
    const finalToAmount = calculateOutput(parsedFromAmount, lockedRateInModal)

    const swapPayload = {
      userId,
      fromAsset,
      toAsset,
      fromAmount: parsedFromAmount,
      toAmount: finalToAmount,
    }

    const primaryUrl = `${GATEWAY_URL}/api/v1/wallet/swap`
    const fallbackUrl = "http://localhost:8084/api/v1/wallet/swap"

    try {
      let response = await fetchWithAuth(primaryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(swapPayload),
      }).catch(() => null)

      if (!response || !response.ok) {
        const token = user?.token || ""
        response = await fetch(fallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(swapPayload),
        }).catch(() => null)
      }

      if (!response) {
        throw new Error("Could not connect to Swap Engine or Gateway.")
      }

      const resData = await response.json()

      if (!response.ok) {
        throw new Error(resData.error || "Swap execution failed.")
      }

      setLastFilled({
        from: fromAsset,
        fromAmt: parsedFromAmount,
        to: toAsset,
        toAmt: finalToAmount,
      })

      handleCloseModal()

      // Dispatch custom events for immediate UI responsiveness & Notification Bell
      const usdValue = fromAsset === "USDC" ? parsedFromAmount : finalToAmount
      const btcValue = fromAsset === "BTC" ? parsedFromAmount : finalToAmount

      window.dispatchEvent(
        new CustomEvent("wave:risk-report", {
          detail: {
            usd: usdValue,
            btc: btcValue,
            rate: lockedRateInModal,
            time: new Date().toISOString(),
          },
        })
      )

      window.dispatchEvent(new CustomEvent("wave:balance-update"))
    } catch (err: any) {
      setApiError(err.message || "Failed to complete swap operation.")
    } finally {
      setIsSwapping(false)
    }
  }

  const modalOutputAmount = calculateOutput(parsedFromAmount, lockedRateInModal)

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-card border border-border rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center mb-2">
          <div className="bg-emerald-500/10 rounded-full p-2.5 mr-3 border border-emerald-500/20">
            <ArrowLeftRight className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Instant Swap</h2>
            <p className="text-muted-foreground text-xs">Swap assets instantly at live market rates</p>
          </div>
        </div>

        {apiError && !isModalOpen && (
          <div className="mt-3 bg-rose-950/60 border border-rose-500/40 p-3 rounded-lg text-xs text-rose-300 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{apiError}</div>
          </div>
        )}

        {/* You Pay Input */}
        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
          <label className="block text-xs font-medium text-muted-foreground mb-2">You pay</label>
          <div className="flex items-center justify-between">
            <input
              type="number"
              min={0}
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-bold text-foreground focus:outline-none placeholder-muted-foreground/50 font-mono"
            />
            <div className="flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 shrink-0 shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {fromAsset === "USDC" ? "$" : "₿"}
              </span>
              <span className="text-sm font-semibold text-foreground">{fromAsset}</span>
            </div>
          </div>
        </div>

        {/* Swap Direction Divider */}
        <div className="relative flex justify-center py-1.5">
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
          <button
            onClick={handleFlipAssets}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card hover:bg-muted transition-transform active:scale-95 shadow-sm"
            title="Flip Assets"
          >
            <ArrowDown className="h-4 w-4 text-emerald-500" />
          </button>
        </div>

        {/* You Receive Output */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <label className="block text-xs font-medium text-muted-foreground mb-2">You receive (estimated)</label>
          <div className="flex items-center justify-between">
            <span className="w-full text-2xl font-bold text-foreground font-mono">
              {toAsset === "BTC" ? calculatedToAmount.toFixed(6) : calculatedToAmount.toFixed(2)}
            </span>
            <div className="flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 shrink-0 shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                {toAsset === "BTC" ? "₿" : "$"}
              </span>
              <span className="text-sm font-semibold text-foreground">{toAsset}</span>
            </div>
          </div>
        </div>

        {/* Soft Idle Base Conversion Rate (No constant ticking loop) */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            1 BTC = ${currentRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="font-medium text-foreground">Network fee: ~$1.50</span>
        </div>

        <button
          onClick={handleOpenPreviewModal}
          disabled={parsedFromAmount <= 0}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-3 font-semibold text-sm text-slate-950 shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Preview Swap</span>
        </button>

        {lastFilled && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-300 animate-in fade-in duration-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Swap Executed! Swapped {lastFilled.fromAmt} {lastFilled.from} for{" "}
              {lastFilled.to === "BTC" ? lastFilled.toAmt.toFixed(6) : lastFilled.toAmt.toFixed(2)} {lastFilled.to}. Check Notification Bell for audit report.
            </span>
          </div>
        )}
      </div>

      {/* 10-Second Rate Lock Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-500" />
                <span>Confirm Guaranteed Swap</span>
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {apiError && (
              <div className="bg-rose-950/60 border border-rose-500/40 p-3 rounded-lg text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <div>{apiError}</div>
              </div>
            )}

            {/* 10-Second Countdown Wheel Header */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Guaranteed Exchange Rate Locked
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold font-mono text-emerald-500">
                  {modalSecondsLeft > 0 ? `${modalSecondsLeft}s` : "Expired"}
                </span>
                <div className="h-5 w-5 relative">
                  <svg viewBox="0 0 36 36" className="h-5 w-5 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 15}
                      strokeDashoffset={2 * Math.PI * 15 * (1 - modalSecondsLeft / MODAL_LOCK_SECONDS)}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Swap Summary */}
            <div className="space-y-3 bg-muted/40 border border-border rounded-xl p-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">You Pay</span>
                <span className="font-bold text-foreground font-mono">
                  {parsedFromAmount} {fromAsset}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">You Receive</span>
                <span className="font-extrabold text-emerald-500 font-mono text-sm">
                  {toAsset === "BTC" ? modalOutputAmount.toFixed(6) : modalOutputAmount.toFixed(2)} {toAsset}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center text-muted-foreground">
                <span>Locked Conversion Rate</span>
                <span className="font-semibold text-foreground font-mono">
                  1 BTC = ${lockedRateInModal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Estimated Network Fee</span>
                <span className="font-semibold text-foreground">$1.50 USDC</span>
              </div>
            </div>

            {modalSecondsLeft > 0 ? (
              <button
                onClick={handleConfirmSwap}
                disabled={isSwapping}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-3 font-bold text-sm text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50"
              >
                {isSwapping ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Executing Swap...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirm Swap ({modalSecondsLeft}s)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleRefreshModalRate}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 font-bold text-sm text-slate-950 shadow-lg transition-all duration-200"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>Rate Expired — Refresh Rate</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
