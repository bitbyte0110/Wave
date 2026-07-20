"use client"
import { MoreVertical, ChevronDown, ChevronUp } from "lucide-react"

export default function OrderbookTrades() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Orderbook and Trades</h2>
        <button>
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center mb-4">
        <div className="flex items-center">
          <div className="bg-orange-500 rounded-full h-6 w-6 flex items-center justify-center mr-2">
            <span className="text-white text-xs">₿</span>
          </div>
          <span className="font-medium">Bitcoin</span>
        </div>
      </div>

      <div className="flex items-baseline mb-4">
        <div className="text-2xl font-bold">7,094.86</div>
        <div className="ml-2 text-sm">
          <span className="text-emerald-500">80.82</span>
          <span className="text-emerald-500 ml-1">(1.15%)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-xs text-muted-foreground">Bid Size (BTC)</div>
            <div className="text-xs text-muted-foreground">Bid Price (USD)</div>
          </div>

          <div className="space-y-1">
            {[
              { size: "2.075", price: "18,795.6" },
              { size: "1.6275", price: "18,794.4" },
              { size: "0.4075", price: "18,793.8" },
              { size: "24.075", price: "18,791.0" },
              { size: "0.00029", price: "18,790.8" },
              { size: "0.7159", price: "18,802.0" },
              { size: "23971", price: "18,803.0" },
            ].map((item, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 text-xs">
                <div>{item.size}</div>
                <div className="text-emerald-500">{item.price}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-xs text-muted-foreground">Ask Price (USD)</div>
            <div className="text-xs text-muted-foreground">Ask Size (BTC)</div>
          </div>

          <div className="space-y-1">
            {[
              { price: "18,795.6", size: "1.0000" },
              { price: "18,796.0", size: "0.2032" },
              { price: "18,797.0", size: "0.2032" },
              { price: "18,798.5", size: "25.1227" },
              { price: "18,800.5", size: "0.0080" },
              { price: "18,802.0", size: "0.0080" },
              { price: "18,803.0", size: "0.0080" },
            ].map((item, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-red-500">{item.price}</div>
                <div>{item.size}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 mt-4">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">Vol</div>
            <div className="text-xs">$7,998</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">Open</div>
            <div className="text-xs text-red-500">7,028.01</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">Low</div>
            <div className="text-xs text-red-500">6,967.37</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">52w L</div>
            <div className="text-xs">6,699.30</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">Mkt Cap</div>
            <div className="text-xs">0</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">Shares</div>
            <div className="text-xs">939.91M PCS</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">Trades</div>
            <div className="text-xs">87.85K</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">High</div>
            <div className="text-xs text-emerald-500">7,054.28</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">52w H</div>
            <div className="text-xs">7,459.20</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-xs text-muted-foreground">NFI/FI</div>
            <div className="text-xs text-emerald-500">932.18M</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
        <button className="bg-emerald-500 text-white px-6 py-2 rounded font-medium flex-1 flex items-center justify-center">
          BUY
          <ChevronDown className="h-4 w-4 inline-block ml-1" />
        </button>
        <button className="bg-red-500 text-white px-6 py-2 rounded font-medium flex-1 flex items-center justify-center">
          SELL
          <ChevronUp className="h-4 w-4 inline-block ml-1" />
        </button>
      </div>
    </div>
  )
}
