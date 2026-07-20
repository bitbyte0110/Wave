"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, RefreshCw, ChevronDown, BarChart2, TrendingUp, AlertCircle } from "lucide-react"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI trading assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    },
    {
      id: "2",
      content: "Can you analyze the current Bitcoin trend?",
      role: "user",
      timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
    },
    {
      id: "3",
      content:
        "Based on recent market data, Bitcoin is showing a bullish pattern with increasing volume. The 4-hour chart indicates a potential breakout above the $45,000 resistance level. If this level is maintained, we could see movement toward $48,000 in the short term. However, watch for support at $43,500 if there's a pullback.",
      role: "assistant",
      timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
    },
    {
      id: "4",
      content: "What's your recommendation for Ethereum in the next week?",
      role: "user",
      timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    },
    {
      id: "5",
      content:
        "Ethereum is currently consolidating after its recent rally. Key metrics to watch:\n\n1. Support level: $2,800\n2. Resistance level: $3,200\n3. RSI: 62 (slightly overbought)\n\nWith the upcoming protocol upgrade, there's positive sentiment, but the market might need to cool off before the next leg up. Consider dollar-cost averaging rather than a lump sum investment at current levels.",
      role: "assistant",
      timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
    },
  ])

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponses = [
        "Based on the current market conditions, I'd recommend maintaining a diversified portfolio with no more than 30% allocation to any single asset. Bitcoin's volatility index suggests potential for significant price movement in the next 48 hours.",
        "Looking at the technical indicators, we're seeing a classic head and shoulders pattern forming on the 4-hour chart. The RSI is currently at 72, suggesting overbought conditions. Consider taking some profits if you're in a leveraged position.",
        "The recent market dip presents a potential buying opportunity. On-chain metrics show accumulation by whale addresses, which has historically preceded upward price movement. However, maintain stop losses at key support levels.",
        "Analyzing the correlation between Bitcoin and traditional markets, we're seeing a decoupling from tech stocks over the past week. This could indicate a shift in market dynamics worth monitoring for your trading strategy.",
      ]

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-emerald-100 rounded-full p-2 mr-3">
            <Bot className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trading Assistant</h1>
            <p className="text-gray-500 text-sm">AI-powered insights for your trading decisions</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-white border rounded-md text-sm font-medium flex items-center hover:bg-gray-50">
            <RefreshCw className="h-4 w-4 mr-2" />
            New Chat
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700">
            <BarChart2 className="h-4 w-4 inline-block mr-2" />
            Market Analysis
          </button>
        </div>
      </div>

      {/* Chat container */}
      <div className="flex-1 bg-white rounded-lg border overflow-hidden flex flex-col">
        {/* Chat header */}
        <div className="border-b p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                <Bot className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <div className="font-medium">Trading Assistant</div>
                <div className="text-xs text-gray-500 flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-1"></span>
                  Online
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-2 hover:bg-gray-100 rounded-md">
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <div className="flex items-center mb-1">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center mr-2 ${
                      message.role === "user" ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-3 w-3 text-white" />
                    ) : (
                      <Bot className="h-3 w-3 text-emerald-600" />
                    )}
                  </div>
                  <div className={`text-xs ${message.role === "user" ? "text-emerald-100" : "text-gray-500"}`}>
                    {message.role === "user" ? "You" : "Trading Assistant"} • {formatTime(message.timestamp)}
                  </div>
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 text-gray-800 rounded-bl-none">
                <div className="flex items-center mb-1">
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <Bot className="h-3 w-3 text-emerald-600" />
                  </div>
                  <div className="text-xs text-gray-500">Trading Assistant • Typing...</div>
                </div>
                <div className="flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div
                    className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about market trends, trading strategies, or specific assets..."
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
                disabled={isLoading}
              />
              <div className="absolute right-3 top-3 text-xs text-gray-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Not financial advice
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-lg ${
                !input.trim() || isLoading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>Market data updated as of {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
