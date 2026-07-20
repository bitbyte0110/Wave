import { MoreVertical } from "lucide-react"

export default function MarketTrades() {
  const marketTradesData = [
    {
      price: "16,796.0",
      size: "0.0040",
      time: "10:34:50 AM",
    },
    {
      price: "16,794.5",
      size: "0.0078",
      time: "10:34:51 AM",
    },
    {
      price: "16,793.0",
      size: "0.001",
      time: "10:34:55 AM",
    },
    {
      price: "16,791.0",
      size: "0.0028",
      time: "10:34:56 AM",
    },
    {
      price: "16,790.0",
      size: "0.0020",
      time: "10:34:58 AM",
    },
    {
      price: "16,789.0",
      size: "0.0007",
      time: "10:35:02 AM",
    },
    {
      price: "16,788.0",
      size: "0.0007",
      time: "10:35:07 AM",
    },
    {
      price: "16,786.0",
      size: "0.0020",
      time: "10:35:12 AM",
    },
  ]

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Market Trades</h2>
        <button>
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[400px]">
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-muted-foreground">
            <div>Price (USD)</div>
            <div>Size (BTC)</div>
            <div>Time</div>
          </div>

          <div className="space-y-2">
            {marketTradesData.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-2 text-xs border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <div className="text-emerald-500">{item.price}</div>
                <div>{item.size}</div>
                <div>{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
