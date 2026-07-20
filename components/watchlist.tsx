import { MoreVertical } from "lucide-react"

export default function Watchlist() {
  const watchlistData = [
    {
      stock: "BTC",
      last: "748.00",
      change: "+0.40%",
      changeColor: "text-emerald-500",
      volume: "$14.99M",
      price: "16,796.0",
      size: "0.0040",
      time: "10:34:50 AM",
    },
    {
      stock: "AXV",
      last: "38.20",
      change: "-0.80%",
      changeColor: "text-red-500",
    },
    {
      stock: "AXV",
      last: "38.20",
      change: "-0.80%",
      changeColor: "text-red-500",
      volume: "$3.50M",
      price: "16,794.5",
      size: "0.0078",
      time: "10:34:51 AM",
    },
    {
      stock: "AI",
      last: "32.06",
      change: "+0.15%",
      changeColor: "text-emerald-500",
      volume: "$28.33M",
      price: "16,793.0",
      size: "0.001",
      time: "10:34:55 AM",
    },
    {
      stock: "BCO",
      last: "122.20",
      change: "-0.55%",
      changeColor: "text-red-500",
      volume: "$39.23M",
      price: "16,791.0",
      size: "0.0028",
      time: "10:34:56 AM",
    },
    {
      stock: "CT",
      last: "25.60",
      change: "-0.44%",
      changeColor: "text-red-500",
      volume: "$46.45M",
      price: "16,790.0",
      size: "0.0020",
      time: "10:34:58 AM",
    },
    {
      stock: "JPC",
      last: "243.60",
      change: "-0.39%",
      changeColor: "text-red-500",
      volume: "$25.44M",
      price: "16,789.0",
      size: "0.0007",
      time: "10:35:02 AM",
    },
    {
      stock: "LTO",
      last: "90.15",
      change: "+0.40%",
      changeColor: "text-emerald-500",
      volume: "$5.95M",
      price: "16,788.0",
      size: "0.0007",
      time: "10:35:07 AM",
    },
    {
      stock: "SM",
      last: "844.50",
      change: "+0.40%",
      changeColor: "text-emerald-500",
      volume: "$8.78M",
      price: "16,786.0",
      size: "0.0020",
      time: "10:35:12 AM",
    },
  ]

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Watchlist</h2>
        <button>
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[400px]">
          <div className="grid grid-cols-4 gap-2 mb-2 text-xs text-muted-foreground">
            <div>Stock</div>
            <div>Last</div>
            <div>Chg(%)</div>
            <div>Volume</div>
          </div>

          <div className="space-y-2">
            {watchlistData.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-2 text-xs border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <div>{item.stock}</div>
                <div>{item.last}</div>
                <div className={item.changeColor}>{item.change}</div>
                <div>{item.volume}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
