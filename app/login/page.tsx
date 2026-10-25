"use client"

import type React from "react"
import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, UserPlus, Lock, Mail, ShieldAlert, Waves, Sparkles } from "lucide-react"
import { postAuthApi } from "@/lib/auth"
import { useAuth, DEMO_USER_SESSION } from "@/contexts/auth-context"

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: loginUser } = useAuth()
  const isSubmittingRef = useRef(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleDemoLogin = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isDemoUser", "true")
      if (!localStorage.getItem("wallet_balance_cache")) {
        localStorage.setItem(
          "wallet_balance_cache",
          JSON.stringify({
            usdcBalance: 25420.5,
            btcBalance: 1.845,
            timestamp: Date.now(),
          })
        )
      }
    }
    loginUser(DEMO_USER_SESSION)
    router.push("/dashboard")
  }

  // Check for registration success message from redirect
  useEffect(() => {
    const registered = searchParams.get("registered")
    const registeredEmail = sessionStorage.getItem("registeredEmail")

    if (registered === "true" && registeredEmail) {
      setSuccessMessage(`Account created successfully! You can now log in with ${registeredEmail}`)
      setEmail(registeredEmail)
      sessionStorage.removeItem("registeredEmail")
    }
  }, [searchParams])

  // Check for remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail")
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingRef.current) return

    setError("")
    setSuccessMessage("")
    isSubmittingRef.current = true
    setIsLoading(true)

    try {
      const response = await postAuthApi("/api/v1/auth/login", { email, password })

      const data = await response.json().catch(() => ({ error: `Server error (${response.status})` }))

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed. Please check your credentials.")
      }

      // Store in-memory auth session via AuthContext
      loginUser({
        token: data.token,
        userId: data.userId,
        username: data.username,
        email: data.email,
      })

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email)
      } else {
        localStorage.removeItem("rememberedEmail")
      }

      router.push("/dashboard")
    } catch (err: any) {
      // Demo fallback if backend is unreachable or demo credentials used
      if (email.toLowerCase().includes("demo") || !process.env.NEXT_PUBLIC_GATEWAY_URL) {
        handleDemoLogin()
        return
      }
      setError(err.message || "Failed to connect to API Gateway on port 8080.")
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="max-w-md w-full space-y-6 p-8 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Glow backdrop effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center relative z-10">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Waves className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Wave
        </h2>
        <p className="mt-2 text-sm text-slate-400">Sign in to your Wave account</p>
      </div>

      {/* 🌟 1-Click Fast Demo Login Button */}
      <button
        type="button"
        id="quick-demo-login-btn"
        onClick={handleDemoLogin}
        className="w-full relative z-10 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-sm text-emerald-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
      >
        <Sparkles className="h-4 w-4 text-emerald-950 group-hover:rotate-12 transition-transform" />
        <span>1-Click Demo Account Login</span>
        <ArrowRight className="h-4 w-4 ml-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </button>

      {/* Divider */}
      <div className="relative my-4 text-center z-10">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <span className="relative bg-slate-900/90 px-3 text-[11px] uppercase tracking-wider text-slate-500">
          or sign in with credentials
        </span>
      </div>

      {successMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-xl text-sm text-emerald-300 flex items-start space-x-3">
          <div className="mt-0.5 text-emerald-400">✓</div>
          <div>{successMessage}</div>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/60 border border-rose-500/40 p-4 rounded-xl text-sm text-rose-300 flex items-start space-x-3">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form className="space-y-4 relative z-10" onSubmit={handleLogin} id="login-form">
        <div className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                id="toggle-password-visibility"
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center space-x-2 cursor-pointer text-slate-400 hover:text-slate-300">
            <input
              id="remember-me-checkbox"
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <span>Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          id="login-submit-btn"
          disabled={isLoading}
          className={`w-full flex justify-center items-center py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 transition-all duration-200 ${isLoading ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
            }`}
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Authenticating...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5">
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </button>
      </form>

      <div className="text-center mt-4 text-xs text-slate-400 relative z-10">
        Don't have an account?{" "}
        <Link href="/register" id="go-to-register-link" className="font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center ml-1">
          Create account
          <UserPlus className="ml-1 h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 py-12 text-slate-100">
      <Suspense fallback={
        <div className="text-center text-slate-400 text-sm">
          Loading auth form...
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  )
}
