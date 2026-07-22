"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, UserPlus, Lock, Mail, ShieldAlert, Sparkles } from "lucide-react"
import { postAuthApi, setAuthSession } from "@/lib/auth"

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // Demo credentials helper
  const demoCredentials = {
    email: "demo@example.com",
    password: "password123",
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
    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      const response = await postAuthApi("/api/v1/auth/login", { email, password })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed. Please check your credentials.")
      }

      // Persist auth session
      setAuthSession({
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
      setError(err.message || "Failed to connect to API Gateway on port 8080.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoFill = () => {
    setEmail(demoCredentials.email)
    setPassword(demoCredentials.password)
  }

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Glow backdrop effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center relative z-10">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Wave Terminal
        </h2>
        <p className="mt-2 text-sm text-slate-400">Sign in via Edge API Gateway</p>
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

      <form className="mt-8 space-y-5 relative z-10" onSubmit={handleLogin} id="login-form">
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
          className={`w-full flex justify-center items-center py-3 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 transition-all duration-200 ${
            isLoading ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
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

      <div className="mt-6 pt-6 border-t border-slate-800/80 relative z-10">
        <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs">
          <div>
            <p className="font-medium text-slate-300">Quick Demo Fill</p>
            <p className="text-slate-500">{demoCredentials.email}</p>
          </div>
          <button
            type="button"
            id="fill-demo-credentials-btn"
            onClick={handleDemoFill}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium transition-colors"
          >
            Fill Demo
          </button>
        </div>
      </div>

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
