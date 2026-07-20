import { MoreVertical } from "lucide-react"

export default function ExploreMarket() {
  const cryptoData = [
    {
      name: "Bitcoin",
      icon: "₿",
      iconColor: "bg-orange-500",
      buyPrice: "$10,345.0",
      sellPrice: "$11,456.0",
      lastPrice: "$12,765.1",
      lowestPrice: "$13,432",
      highestPrice: "$11,875.2",
    },
    {
      name: "Ethereum",
      icon: "Ξ",
      iconColor: "bg-blue-500",
      buyPrice: "$10,987.0",
      sellPrice: "$12,123.0",
      lastPrice: "$13,985.1",
      lowestPrice: "$14,981",
      highestPrice: "$12,974.2",
    },
    {
      name: "LTC/USD",
      icon: "Ł",
      iconColor: "bg-gray-500",
      buyPrice: "$10,345.0",
      sellPrice: "$11,456.0",
      lastPrice: "$12,765.1",
      lowestPrice: "$13,432",
      highestPrice: "$11,875.2",
    },
    {
      name: "XRP/USD",
      icon: "✕",
      iconColor: "bg-gray-700",
      buyPrice: "$10,345.0",
      sellPrice: "$11,456.0",
      lastPrice: "$12,765.1",
      lowestPrice: "$13,432",
      highestPrice: "$11,875.2",
    },
    {
      name: "Ripple",
      icon: "R",
      iconColor: "bg-blue-400",
      buyPrice: "$10,987.0",
      sellPrice: "$12,123.0",
      lastPrice: "$13,985.1",
      lowestPrice: "$14,981",
      highestPrice: "$12,974.2",
    },
    {
      name: "Moreno",
      icon: "M",
      iconColor: "bg-orange-400",
      buyPrice: "$10,987.0",
      sellPrice: "$12,123.0",
      lastPrice: "$13,985.1",
      lowestPrice: "$14,981",
      highestPrice: "$12,974.2",
    },
    {
      name: "ZCash",
      icon: "Z",
      iconColor: "bg-gray-600",
      buyPrice: "$10,987.0",
      sellPrice: "$12,123.0",
      lastPrice: "$13,985.1",
      lowestPrice: "$14,981",
      highestPrice: "$12,974.2",
    },
    {
      name: "Ethereum",
      icon: "Ξ",
      iconColor: "bg-blue-500",
      buyPrice: "$10,987.0",
      sellPrice: "$12,123.0",
      lastPrice: "$13,985.1",
      lowestPrice: "$14,981",
      highestPrice: "$12,974.2",
    },
  ]

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Explore Market</h2>
        <button>
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[800px]">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 text-left">CRYPTO NAME</th>
                <th className="pb-2 text-left">BUY PRICE</th>
                <th className="pb-2 text-left">SELL PRICE</th>
                <th className="pb-2 text-left">LAST PRICE</th>
                <th className="pb-2 text-left">LOWEST PRICE</th>
                <th className="pb-2 text-left">HIGHEST PRICE</th>
              </tr>
            </thead>
            <tbody>
              {cryptoData.map((crypto, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className={`${crypto.iconColor} rounded-full h-6 w-6 flex items-center justify-center mr-2`}>
                        <span className="text-white text-xs">{crypto.icon}</span>
                      </div>
                      <span className="font-medium text-sm">{crypto.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm">{crypto.buyPrice}</td>
                  <td className="py-3 text-sm">{crypto.sellPrice}</td>
                  <td className="py-3 text-sm">{crypto.lastPrice}</td>
                  <td className="py-3 text-sm">{crypto.lowestPrice}</td>
                  <td className="py-3 text-sm">{crypto.highestPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
