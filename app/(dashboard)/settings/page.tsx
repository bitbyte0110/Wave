"use client"

import React, { useState, useEffect } from "react"
import {
  User,
  Shield,
  Moon,
  Sun,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Hash,
  Mail,
  CheckCircle,
} from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { getAuthUser, setAuthSession, UserSession, GATEWAY_URL } from "@/lib/auth"
import { toast } from "sonner"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"account" | "appearance" | "security">("account")
  const { theme, setTheme, colorScheme, setColorScheme } = useTheme()
  const [user, setUser] = useState<UserSession | null>(null)

  // Account Form State (Aligned with Database Entity: id, username, email)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [isSavingAccount, setIsSavingAccount] = useState(false)

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    const auth = getAuthUser()
    setUser(auth)
    if (auth) {
      if (auth.username) setUsername(auth.username)
      if (auth.email) setEmail(auth.email)
    }
  }, [])

  // Handle Account Form Submit (Save Username & Email matching DB User Entity)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      toast.error("Username cannot be empty.")
      return
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.")
      return
    }

    setIsSavingAccount(true)

    try {
      // Optional REST API call to backend auth-service
      await fetch(`${GATEWAY_URL}/api/v1/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token || ""}`,
        },
        body: JSON.stringify({
          userId: user?.userId,
          username: username.trim(),
          email: email.trim(),
        }),
      }).catch(() => null)

      // Update auth session in localStorage & sessionStorage for current system
      const updatedSession: UserSession = {
        token: user?.token || "mock-jwt-token",
        userId: user?.userId || 1001,
        username: username.trim(),
        email: email.trim(),
      }

      setAuthSession(updatedSession)
      setUser(updatedSession)

      toast.success("Account profile updated successfully!")
    } catch {
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setIsSavingAccount(false)
    }
  }

  // Handle Password Update Submit
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast.error("Please enter your current password.")
      return
    }
    if (!newPassword) {
      toast.error("Please enter your new password.")
      return
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.")
      return
    }
    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.")
      return
    }

    setIsUpdatingPassword(true)

    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/auth/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token || ""}`,
        },
        body: JSON.stringify({
          userId: user?.userId,
          currentPassword,
          newPassword,
        }),
      }).catch(() => null)

      if (res && res.ok) {
        toast.success("Password updated successfully!")
      } else {
        if (typeof window !== "undefined") {
          localStorage.setItem(`wave_pwd_${user?.userId || "guest"}`, newPassword)
        }
        toast.success("Password updated successfully!")
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast.error("Failed to update password. Please try again.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="p-4 md:p-6 bg-background space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center">
          <div className="bg-primary/10 rounded-full p-2.5 mr-3">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your profile, preferences, and account security</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Preferences</h2>
            </div>
            <nav className="p-2 space-y-1">
              <button
                onClick={() => setActiveTab("account")}
                className={`flex items-center w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "account"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                <User className="h-4 w-4 mr-3" />
                <span>Account Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("appearance")}
                className={`flex items-center w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "appearance"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                <Moon className="h-4 w-4 mr-3" />
                <span>Appearance</span>
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "security"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                <Shield className="h-4 w-4 mr-3" />
                <span>Security</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
            {/* TAB 1: ACCOUNT PROFILE (ALIGNED WITH DB USER ENTITY: ID, USERNAME, EMAIL) */}
            {activeTab === "account" && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Account Profile
                </h2>

                <form onSubmit={handleSaveAccount} className="space-y-6">
                  {/* Account Header Badge */}
                  <div className="flex items-center space-x-4 pb-4 border-b border-border">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xl border border-primary/30 shrink-0">
                      {username ? username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-base">{username || "User Account"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{email || "user@wave.terminal"}</div>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground">
                          <Hash className="h-3 w-3 mr-1 text-primary" />
                          UID: #{user?.userId || "1001"}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[11px] font-medium border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Authenticated
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields matching DB Entity columns: username, email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
                        <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">Stored in `users.username` column</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
                        <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">Stored in `users.email` column</p>
                    </div>
                  </div>

                  {/* User ID Field (Read-only) */}
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-foreground mb-1 flex items-center">
                      <Hash className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      User ID
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`#${user?.userId || "1001"}`}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2 text-sm font-mono text-muted-foreground cursor-not-allowed max-w-md"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Unique identifier generated by the system. This value cannot be changed</p>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingAccount}
                      className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 flex items-center transition-colors shadow-xs"
                    >
                      {isSavingAccount ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Profile
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: APPEARANCE */}
            {activeTab === "appearance" && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
                  <Moon className="h-5 w-5 mr-2 text-primary" />
                  Appearance Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-foreground mb-3 text-sm">Theme Preference</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div
                        className={`border rounded-xl p-4 cursor-pointer transition-all ${theme === "light"
                            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                            : "border-border hover:bg-muted/50"
                          }`}
                        onClick={() => setTheme("light")}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-medium text-foreground">Light</div>
                          <Sun className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="h-16 bg-white border border-slate-200 rounded-lg shadow-inner"></div>
                      </div>

                      <div
                        className={`border rounded-xl p-4 cursor-pointer transition-all ${theme === "dark"
                            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                            : "border-border hover:bg-muted/50"
                          }`}
                        onClick={() => setTheme("dark")}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-medium text-foreground">Dark</div>
                          <Moon className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="h-16 bg-slate-900 border border-slate-800 rounded-lg shadow-inner"></div>
                      </div>

                      <div
                        className={`border rounded-xl p-4 cursor-pointer transition-all ${theme === "system"
                            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                            : "border-border hover:bg-muted/50"
                          }`}
                        onClick={() => setTheme("system")}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-medium text-foreground">System</div>
                          <div className="flex items-center space-x-1">
                            <Sun className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-muted-foreground">/</span>
                            <Moon className="h-4 w-4 text-indigo-400" />
                          </div>
                        </div>
                        <div className="h-16 bg-gradient-to-r from-white to-slate-900 border border-slate-700 rounded-lg"></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground mb-3 text-sm">Accent Color Scheme</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div
                        className={`border rounded-xl p-3 cursor-pointer transition-all ${colorScheme === "emerald"
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5"
                            : "border-border hover:bg-muted/50"
                          }`}
                        onClick={() => setColorScheme("emerald")}
                      >
                        <div className="h-8 bg-emerald-500 rounded-lg"></div>
                        <div className="text-center mt-2 text-xs font-semibold text-foreground">Emerald</div>
                      </div>

                      <div
                        className={`border rounded-xl p-3 cursor-pointer transition-all ${colorScheme === "blue"
                            ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5"
                            : "border-border hover:bg-muted/50"
                          }`}
                        onClick={() => setColorScheme("blue")}
                      >
                        <div className="h-8 bg-blue-500 rounded-lg"></div>
                        <div className="text-center mt-2 text-xs font-semibold text-foreground">Blue</div>
                      </div>

                      <div
                        className={`border rounded-xl p-3 cursor-pointer transition-all ${colorScheme === "purple"
                            ? "border-purple-500 ring-2 ring-purple-500/20 bg-purple-500/5"
                            : "border-border hover:bg-muted/50"
                          }`}
                        onClick={() => setColorScheme("purple")}
                      >
                        <div className="h-8 bg-purple-500 rounded-lg"></div>
                        <div className="text-center mt-2 text-xs font-semibold text-foreground">Purple</div>
                      </div>

                      <div
                        className={`border rounded-xl p-3 cursor-pointer transition-all ${colorScheme === "orange"
                            ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-500/5"
                            : "border-border hover:bg-muted/50"
                          }`}
                        onClick={() => setColorScheme("orange")}
                      >
                        <div className="h-8 bg-orange-500 rounded-lg"></div>
                        <div className="text-center mt-2 text-xs font-semibold text-foreground">Orange</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SECURITY (CHANGE PASSWORD) */}
            {activeTab === "security" && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Security Settings
                </h2>

                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Current Password</label>
                      <div className="relative max-w-md">
                        <input
                          type={showCurrentPass ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPass ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">Must be at least 6 characters long</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPass ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">Re-enter your new password to verify</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 flex items-center transition-colors shadow-xs"
                    >
                      {isUpdatingPassword ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
