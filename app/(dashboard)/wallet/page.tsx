"use client"

import { useState } from "react"
import { Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw, Download, ArrowLeftRight } from "lucide-react"
import WalletBalance from "@/components/wallet/wallet-balance"
import AssetDistribution from "@/components/wallet/asset-distribution"
import TransactionHistory from "@/components/wallet/transaction-history"
import QuickActions from "@/components/wallet/quick-actions"
import RecentActivity from "@/components/wallet/recent-activity"
import InstantSwap from "@/components/wallet/instant-swap"

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "deposit" | "withdraw" | "transfer" | "trade">("overview")

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-emerald-100 rounded-full p-2 mr-3">
            <Wallet className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Wallet</h1>
            <p className="text-gray-500 text-sm">Manage your crypto assets</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white border rounded-md text-sm font-medium flex items-center hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700">
            <RefreshCw className="h-4 w-4 inline-block mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex overflow-x-auto pb-2 -mx-1">
          <button
            className={`px-4 py-2 mx-1 rounded-md text-sm font-medium whitespace-nowrap ${
              activeTab === "overview" ? "bg-emerald-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 mx-1 rounded-md text-sm font-medium whitespace-nowrap flex items-center ${
              activeTab === "deposit" ? "bg-emerald-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("deposit")}
          >
            <ArrowDownLeft className="h-4 w-4 mr-1" />
            Deposit
          </button>
          <button
            className={`px-4 py-2 mx-1 rounded-md text-sm font-medium whitespace-nowrap flex items-center ${
              activeTab === "withdraw" ? "bg-emerald-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("withdraw")}
          >
            <ArrowUpRight className="h-4 w-4 mr-1" />
            Withdraw
          </button>
          <button
            className={`px-4 py-2 mx-1 rounded-md text-sm font-medium whitespace-nowrap ${
              activeTab === "transfer" ? "bg-emerald-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("transfer")}
          >
            Transfer
          </button>
          <button
            className={`px-4 py-2 mx-1 rounded-md text-sm font-medium whitespace-nowrap flex items-center ${
              activeTab === "trade" ? "bg-emerald-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("trade")}
          >
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            Trade
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <WalletBalance />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionHistory />
            </div>
            <div className="space-y-6">
              <AssetDistribution />
              <RecentActivity />
            </div>
          </div>
        </>
      )}

      {activeTab === "deposit" && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold mb-4">Deposit Funds</h2>
          <p className="text-gray-500 mb-6">Select a cryptocurrency to generate a deposit address</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Asset</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
              <option>Bitcoin (BTC)</option>
              <option>Ethereum (ETH)</option>
              <option>Litecoin (LTC)</option>
              <option>Ripple (XRP)</option>
              <option>Cardano (ADA)</option>
            </select>
          </div>

          <div className="bg-gray-50 border rounded-md p-4 mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-2 rounded-md border">
                {/* QR Code placeholder */}
                <div className="h-48 w-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">QR Code</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Deposit Address</label>
              <div className="flex">
                <input
                  type="text"
                  value="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                  readOnly
                  className="w-full border border-gray-300 rounded-l-md px-3 py-2 bg-white"
                />
                <button className="bg-emerald-600 text-white px-4 rounded-r-md hover:bg-emerald-700">Copy</button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Important:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Send only Bitcoin (BTC) to this deposit address</li>
                <li>Ensure the network is Bitcoin (BTC)</li>
                <li>Minimum deposit: 0.0001 BTC</li>
                <li>Your deposit will be available after 2 network confirmations</li>
              </ul>
            </div>
          </div>

          <button className="w-full bg-emerald-600 text-white py-2 rounded-md font-medium hover:bg-emerald-700">
            I've Completed My Deposit
          </button>
        </div>
      )}

      {activeTab === "withdraw" && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold mb-4">Withdraw Funds</h2>
          <p className="text-gray-500 mb-6">Complete the form below to withdraw your crypto</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Asset</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option>Bitcoin (BTC)</option>
                <option>Ethereum (ETH)</option>
                <option>Litecoin (LTC)</option>
                <option>Ripple (XRP)</option>
                <option>Cardano (ADA)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
              <input
                type="text"
                placeholder="Enter recipient's wallet address"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option>Bitcoin (BTC)</option>
                <option>Bitcoin Cash (BCH)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="flex">
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button className="bg-gray-100 text-gray-700 px-4 rounded-r-md border-t border-r border-b border-gray-300">
                  MAX
                </button>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">Available: 0.5473 BTC</span>
                <span className="text-xs text-gray-500">≈ $21,892.00</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-md p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Network Fee</span>
              <span className="text-sm font-medium">0.0005 BTC</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">You Will Receive</span>
              <span className="text-sm font-medium">0.0995 BTC</span>
            </div>
          </div>

          <button className="w-full bg-emerald-600 text-white py-2 rounded-md font-medium hover:bg-emerald-700">
            Withdraw Now
          </button>
        </div>
      )}

      {activeTab === "transfer" && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold mb-4">Transfer Funds</h2>
          <p className="text-gray-500 mb-6">Transfer crypto between your accounts</p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option>Spot Wallet</option>
                <option>Trading Account</option>
                <option>Savings Account</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option>Trading Account</option>
                <option>Spot Wallet</option>
                <option>Savings Account</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option>Bitcoin (BTC)</option>
                <option>Ethereum (ETH)</option>
                <option>Litecoin (LTC)</option>
                <option>Ripple (XRP)</option>
                <option>Cardano (ADA)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="flex">
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button className="bg-gray-100 text-gray-700 px-4 rounded-r-md border-t border-r border-b border-gray-300">
                  MAX
                </button>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">Available: 0.5473 BTC</span>
                <span className="text-xs text-gray-500">≈ $21,892.00</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-emerald-600 text-white py-2 rounded-md font-medium hover:bg-emerald-700">
            Transfer Now
          </button>
        </div>
      )}

      {activeTab === "trade" && <InstantSwap />}
    </div>
  )
}
