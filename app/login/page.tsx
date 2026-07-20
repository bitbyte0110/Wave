"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, UserPlus } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  // First, add a new state variable for the "remember me" checkbox
  const [rememberMe, setRememberMe] = useState(false)

  // Example credentials
  const demoCredentials = {
    username: "demo@example.com",
    password: "password123",
  }

  // Check for registration success message
  useEffect(() => {
    const registered = searchParams.get("registered")
    const registeredEmail = sessionStorage.getItem("registeredEmail")

    if (registered === "true" && registeredEmail) {
      setSuccessMessage(`Account created successfully! You can now log in with ${registeredEmail}`)
      setUsername(registeredEmail)
      // Clear the stored email after displaying the message
      sessionStorage.removeItem("registeredEmail")
    }
  }, [searchParams])

  // Update the handleLogin function to include the remember me functionality
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // For demo purposes, accept any credentials
    // In a real app, you would validate against your backend
    setTimeout(() => {
      // Set login state with appropriate expiration based on remember me
      if (rememberMe) {
        // If remember me is checked, set a cookie with a longer expiration (30 days)
        document.cookie = "isLoggedIn=true; path=/; max-age=2592000"
        // Also store the username in localStorage for auto-fill on next visit
        localStorage.setItem("rememberedUsername", username)
      } else {
        // Short session (1 hour)
        document.cookie = "isLoggedIn=true; path=/; max-age=3600"
        // Clear any previously remembered username
        localStorage.removeItem("rememberedUsername")
      }

      sessionStorage.setItem("isLoggedIn", "true")

      // Redirect to dashboard
      router.push("/dashboard")
    }, 1000)
  }

  const handleDemoLogin = () => {
    setUsername(demoCredentials.username)
    setPassword(demoCredentials.password)
  }

  // Add a useEffect to check for remembered username when the component mounts
  useEffect(() => {
    const rememberedUsername = localStorage.getItem("rememberedUsername")
    if (rememberedUsername) {
      setUsername(rememberedUsername)
      setRememberMe(true)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-emerald-100 rounded-full p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-emerald-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Crypto Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to access your account</p>
        </div>

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 text-sm text-green-700">{successMessage}</div>
        )}

        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700">{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="username"
                name="username"
                type="email"
                autoComplete="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm pr-10"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Demo credentials</span>
            </div>
          </div>
          <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Email: {demoCredentials.username}</p>
                <p className="text-sm font-medium text-gray-700">Password: {demoCredentials.password}</p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Use Demo
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-600 hover:text-emerald-500 inline-flex items-center"
            >
              Sign up
              <UserPlus className="ml-1 h-4 w-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
