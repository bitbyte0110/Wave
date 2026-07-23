"use client"

import { useState } from "react"
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react"
import WalletBalance from "@/components/wallet/wallet-balance"
import AssetDistribution from "@/components/wallet/asset-distribution"
import TransactionHistory from "@/components/wallet/transaction-history"
import RecentActivity from "@/components/wallet/recent-activity"
import { GATEWAY_URL, getAuthUser, fetchWithAuth } from "@/lib/auth"

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "deposit" | "withdraw">("overview")

  // Deposit Form State
  const [depositAsset, setDepositAsset] = useState<"USDC" | "BTC">("USDC")
  const [depositAmount, setDepositAmount] = useState("10000")
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState("")
  const [depositError, setDepositError] = useState("")

  // Withdraw Form State
  const [withdrawAsset, setWithdrawAsset] = useState<"USDC" | "BTC">("USDC")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawSuccess, setWithdrawSuccess] = useState("")
  const [withdrawError, setWithdrawError] = useState("")

  // Deposit Handler (POST /api/v1/wallet/deposit)
  const handleDeposit = async () => {
    setDepositSuccess("")
    setDepositError("")
    const amt = Number.parseFloat(depositAmount)
    if (isNaN(amt) || amt <= 0) {
      setDepositError("Please enter a valid deposit amount greater than 0.")
      return
    }

    setIsDepositing(true)
    const user = getAuthUser()
    const userId = user?.userId || 42

    const payload = {
      userId,
      asset: depositAsset,
      amount: amt,
    }

    const primaryUrl = `${GATEWAY_URL}/api/v1/wallet/deposit`
    const fallbackUrl = "http://localhost:8084/api/v1/wallet/deposit"

    try {
      let res = await fetchWithAuth(primaryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null)

      if (!res || !res.ok) {
        const token = user?.token || ""
        res = await fetch(fallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }).catch(() => null)
      }

      if (!res) {
        throw new Error("Could not connect to Swap Engine or Gateway.")
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Deposit failed.")
      }

      setDepositSuccess(`Successfully deposited ${amt} ${depositAsset} into your wallet!`)
      window.dispatchEvent(new CustomEvent("wave:balance-update"))
    } catch (err: any) {
      setDepositError(err.message || "Failed to process deposit.")
    } finally {
      setIsDepositing(false)
    }
  }

  // Withdraw Handler (POST /api/v1/wallet/withdraw with X-Idempotency-Key)
  const handleWithdraw = async () => {
    setWithdrawSuccess("")
    setWithdrawError("")

    if (!recipientAddress.trim()) {
      setWithdrawError("Please enter a valid recipient wallet address.")
      return
    }

    const amt = Number.parseFloat(withdrawAmount)
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError("Please enter a valid withdrawal amount greater than 0.")
      return
    }

    setIsWithdrawing(true)
    const user = getAuthUser()
    const userId = user?.userId || 42
    const idempotencyKey = crypto.randomUUID()

    const payload = {
      userId,
      asset: withdrawAsset,
      amount: amt,
    }

    const primaryUrl = `${GATEWAY_URL}/api/v1/wallet/withdraw`
    const fallbackUrl = "http://localhost:8084/api/v1/wallet/withdraw"

    try {
      let res = await fetchWithAuth(primaryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      }).catch(() => null)

      if (!res || !res.ok) {
        const token = user?.token || ""
        res = await fetch(fallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(payload),
        }).catch(() => null)
      }

      if (!res) {
        throw new Error("Could not connect to Swap Engine or Gateway.")
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Withdrawal failed. Check your wallet balance.")
      }

      setWithdrawSuccess(`Successfully withdrew ${amt} ${withdrawAsset} to ${recipientAddress.slice(0, 10)}...!`)
      setWithdrawAmount("")
      setRecipientAddress("")
      window.dispatchEvent(new CustomEvent("wave:balance-update"))
    } catch (err: any) {
      setWithdrawError(err.message || "Failed to process withdrawal.")
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div className="p-4 md:p-6 bg-background space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-emerald-500/10 rounded-2xl p-2.5 mr-3.5 border border-emerald-500/20">
            <Wallet className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Wallet Operations</h1>
            <p className="text-muted-foreground text-xs">Manage asset deposits, withdrawals, and ledger history</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("wave:balance-update"))}
            className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground flex items-center hover:bg-muted transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 inline-block mr-1.5 text-emerald-500" />
            Refresh Balances
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-border pb-2">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center transition-all ${
              activeTab === "deposit"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("deposit")}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 mr-1" />
            Deposit
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center transition-all ${
              activeTab === "withdraw"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("withdraw")}
          >
            <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
            Withdraw
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <WalletBalance />
            </div>
            <div>
              <AssetDistribution />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionHistory />
            </div>
            <div className="space-y-6">
              <RecentActivity />
            </div>
          </div>
        </>
      )}

      {/* DEPOSIT TAB */}
      {activeTab === "deposit" && (
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 shadow-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Deposit Funds</h2>
            <p className="text-muted-foreground text-xs">Simulate an instant wallet deposit to credit your account</p>
          </div>

          {depositSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>{depositSuccess}</div>
            </div>
          )}

          {depositError && (
            <div className="bg-rose-950/60 border border-rose-500/40 p-3.5 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
              <div>{depositError}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Select Asset
              </label>
              <select
                value={depositAsset}
                onChange={(e) => setDepositAsset(e.target.value as "USDC" | "BTC")}
                className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              >
                <option value="USDC">USDC (USD Coin)</option>
                <option value="BTC">BTC (Bitcoin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Deposit Amount
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="10000"
                className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Target Network</span>
              <span className="font-semibold text-foreground">Ethereum (ERC-20) / Bitcoin Mainnet</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Credit Time</span>
              <span className="font-semibold text-emerald-500">Instant (Wave Engine)</span>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isDepositing}
            className="w-full flex justify-center items-center py-3 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50"
          >
            {isDepositing ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="animate-spin h-4 w-4 text-slate-950" />
                <span>Crediting Wallet...</span>
              </span>
            ) : (
              <span>I've Completed My Deposit</span>
            )}
          </button>
        </div>
      )}

      {/* WITHDRAW TAB */}
      {activeTab === "withdraw" && (
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 shadow-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Withdraw Funds</h2>
            <p className="text-muted-foreground text-xs">Execute operational withdrawal to external wallet address</p>
          </div>

          {withdrawSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>{withdrawSuccess}</div>
            </div>
          )}

          {withdrawError && (
            <div className="bg-rose-950/60 border border-rose-500/40 p-3.5 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
              <div>{withdrawError}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Select Asset
              </label>
              <select
                value={withdrawAsset}
                onChange={(e) => setWithdrawAsset(e.target.value as "USDC" | "BTC")}
                className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              >
                <option value="USDC">USDC (USD Coin)</option>
                <option value="BTC">BTC (Bitcoin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Recipient Wallet Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x71C... or bc1q..."
                className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 placeholder-muted-foreground/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Withdrawal Amount
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="w-full flex justify-center items-center py-3 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50"
          >
            {isWithdrawing ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="animate-spin h-4 w-4 text-slate-950" />
                <span>Processing Withdrawal...</span>
              </span>
            ) : (
              <span>Withdraw Now</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
