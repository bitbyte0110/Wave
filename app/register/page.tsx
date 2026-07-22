"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Check, X, ArrowLeft, User, Mail, Lock, ShieldAlert, Sparkles } from "lucide-react"
import { postAuthApi, setAuthSession } from "@/lib/auth"

function RegisterFormContent() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  // Password requirements
  const passwordRequirements = [
    { id: "length", label: "At least 6 characters", test: (pass: string) => pass.length >= 6 },
    { id: "match", label: "Passwords match", test: (pass: string) => pass.length > 0 && pass === formData.confirmPassword },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!agreeToTerms) {
      newErrors.terms = "You must accept the terms of service"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await postAuthApi("/api/v1/auth/register", {
        email: formData.email,
        username: formData.username,
        password: formData.password,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed. Please try again.")
      }

      // Automatically log in and persist session
      setAuthSession({
        token: data.token,
        userId: data.userId,
        username: data.username,
        email: data.email,
      })

      router.push("/dashboard")
    } catch (err: any) {
      setApiError(err.message || "Could not connect to backend Auth Service.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full space-y-6 p-8 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center relative z-10">
        <div className="flex justify-center mb-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Create Account
        </h2>
        <p className="mt-1 text-xs text-slate-400">Provision wallet & credentials via Wave Gateway</p>
      </div>

      {apiError && (
        <div className="bg-rose-950/60 border border-rose-500/40 p-3.5 rounded-xl text-xs text-rose-300 flex items-start space-x-2.5">
          <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div>{apiError}</div>
        </div>
      )}

      <form className="space-y-4 relative z-10" onSubmit={handleSubmit} id="register-form">
        <div className="space-y-3.5">
          {/* Username Field */}
          <div>
            <label htmlFor="register-username" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="register-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 bg-slate-950/60 border ${
                  errors.username ? "border-rose-500" : "border-slate-800 focus:border-emerald-500"
                } rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all`}
                placeholder="alex_trader"
              />
            </div>
            {errors.username && <p className="mt-1 text-xs text-rose-400">{errors.username}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="register-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2 bg-slate-950/60 border ${
                  errors.email ? "border-rose-500" : "border-slate-800 focus:border-emerald-500"
                } rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all`}
                placeholder="alex@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="register-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-2 bg-slate-950/60 border ${
                  errors.password ? "border-rose-500" : "border-slate-800 focus:border-emerald-500"
                } rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all`}
                placeholder="••••••••"
              />
              <button
                type="button"
                id="toggle-register-password-visibility"
                className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="register-confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-2 bg-slate-950/60 border ${
                  errors.confirmPassword ? "border-rose-500" : "border-slate-800 focus:border-emerald-500"
                } rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none transition-all`}
                placeholder="••••••••"
              />
              <button
                type="button"
                id="toggle-confirm-password-visibility"
                className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword}</p>}
          </div>

          {/* Validation Checklist */}
          <div className="space-y-1 pt-1">
            {passwordRequirements.map((req) => (
              <div key={req.id} className="flex items-center text-xs text-slate-400">
                {req.test(formData.password) ? (
                  <Check className="h-3 w-3 text-emerald-400 mr-1.5 shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-slate-600 mr-1.5 shrink-0" />
                )}
                <span className={req.test(formData.password) ? "text-emerald-400" : "text-slate-500"}>{req.label}</span>
              </div>
            ))}
          </div>

          {/* Terms Agreement */}
          <div className="pt-1">
            <label className="flex items-start space-x-2 cursor-pointer text-xs text-slate-400">
              <input
                id="register-terms-checkbox"
                type="checkbox"
                checked={agreeToTerms}
                onChange={() => setAgreeToTerms(!agreeToTerms)}
                className="mt-0.5 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <span>
                I agree to the{" "}
                <span className="text-emerald-400 underline cursor-pointer">Terms of Service</span> and{" "}
                <span className="text-emerald-400 underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>
            {errors.terms && <p className="mt-1 text-xs text-rose-400">{errors.terms}</p>}
          </div>
        </div>

        <button
          type="submit"
          id="register-submit-btn"
          disabled={isLoading}
          className={`w-full flex justify-center items-center py-2.5 px-4 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 transition-all duration-200 ${
            isLoading ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Creating account...</span>
            </span>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <div className="text-center pt-2 text-xs text-slate-400 relative z-10">
        <Link href="/login" id="back-to-login-link" className="inline-flex items-center font-medium text-emerald-400 hover:text-emerald-300">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to login
        </Link>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-4 py-12 text-slate-100">
      <Suspense fallback={<div className="text-center text-slate-400 text-sm">Loading registration...</div>}>
        <RegisterFormContent />
      </Suspense>
    </div>
  )
}
