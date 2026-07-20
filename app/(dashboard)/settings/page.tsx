"use client"

import { useState } from "react"
import { Settings, User, Bell, Shield, Moon, Sun, Globe, CreditCard, Save } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account")
  const { theme, setTheme, colorScheme, setColorScheme } = useTheme()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    browser: true,
  })
  const [language, setLanguage] = useState("english")
  const [currency, setCurrency] = useState("usd")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Add state for account activity and trading activity
  const [accountActivity, setAccountActivity] = useState(true)
  const [tradingActivity, setTradingActivity] = useState(true)

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-emerald-100 rounded-full p-2 mr-3 dark:bg-emerald-900">
            <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-gray-500 text-sm dark:text-gray-400">Manage your account preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="font-medium">Settings</h2>
            </div>
            <nav className="p-2">
              <button
                onClick={() => setActiveTab("account")}
                className={`flex items-center w-full px-3 py-2 rounded-md text-left ${
                  activeTab === "account" ? "bg-primary/10 text-primary" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <User className="h-4 w-4 mr-3" />
                <span>Account</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center w-full px-3 py-2 rounded-md text-left ${
                  activeTab === "notifications"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Bell className="h-4 w-4 mr-3" />
                <span>Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`flex items-center w-full px-3 py-2 rounded-md text-left ${
                  activeTab === "appearance" ? "bg-primary/10 text-primary" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Moon className="h-4 w-4 mr-3" />
                <span>Appearance</span>
              </button>
              <button
                onClick={() => setActiveTab("language")}
                className={`flex items-center w-full px-3 py-2 rounded-md text-left ${
                  activeTab === "language" ? "bg-primary/10 text-primary" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Globe className="h-4 w-4 mr-3" />
                <span>Language & Region</span>
              </button>
              <button
                onClick={() => setActiveTab("payment")}
                className={`flex items-center w-full px-3 py-2 rounded-md text-left ${
                  activeTab === "payment" ? "bg-primary/10 text-primary" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                <span>Payment Methods</span>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center w-full px-3 py-2 rounded-md text-left ${
                  activeTab === "security" ? "bg-primary/10 text-primary" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Shield className="h-4 w-4 mr-3" />
                <span>Security</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700">
            {/* Account Settings */}
            {activeTab === "account" && (
              <div>
                <h2 className="text-lg font-bold mb-6">Account Settings</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Profile Picture
                    </label>
                    <div className="flex items-center">
                      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center dark:bg-emerald-900">
                        <User className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="ml-5">
                        <button className="bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-gray-200">
                          Change
                        </button>
                        <button className="ml-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        defaultValue="John Doe"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        defaultValue="john.doe@example.com"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        defaultValue="+1 (555) 123-4567"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Country
                      </label>
                      <select
                        id="country"
                        defaultValue="us"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                      >
                        <option value="us">United States</option>
                        <option value="ca">Canada</option>
                        <option value="uk">United Kingdom</option>
                        <option value="au">Australia</option>
                        <option value="de">Germany</option>
                        <option value="fr">France</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={3}
                      defaultValue="Crypto enthusiast and investor since 2017."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                  </div>

                  <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-lg font-bold mb-6">Notification Settings</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Price Alerts</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Get notified when prices change significantly
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.email}
                            onChange={() => setNotifications({ ...notifications, email: !notifications.email })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-gray-700"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Account Activity</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Get notified about sign-ins and security alerts
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accountActivity}
                            onChange={() => setAccountActivity(!accountActivity)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-gray-700"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Push Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Price Alerts</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Get notified when prices change significantly
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.push}
                            onChange={() => setNotifications({ ...notifications, push: !notifications.push })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-gray-700"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Trading Activity</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Get notified about your trades and orders
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tradingActivity}
                            onChange={() => setTradingActivity(!tradingActivity)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-gray-700"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">SMS Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Security Alerts</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Get notified about important security events
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.sms}
                            onChange={() => setNotifications({ ...notifications, sms: !notifications.sms })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-gray-700"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div>
                <h2 className="text-lg font-bold mb-6">Appearance Settings</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Theme</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div
                        className={`border rounded-lg p-4 cursor-pointer dark:border-gray-700 ${theme === "light" ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setTheme("light")}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-medium">Light</div>
                          <Sun className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="h-20 bg-white border rounded-md dark:border-gray-700"></div>
                      </div>
                      <div
                        className={`border rounded-lg p-4 cursor-pointer dark:border-gray-700 ${theme === "dark" ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setTheme("dark")}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-medium">Dark</div>
                          <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div className="h-20 bg-gray-900 rounded-md"></div>
                      </div>
                      <div
                        className={`border rounded-lg p-4 cursor-pointer dark:border-gray-700 ${theme === "system" ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setTheme("system")}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="font-medium">System</div>
                          <div className="flex">
                            <Sun className="h-5 w-5 text-yellow-500" />
                            <span className="mx-1">/</span>
                            <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                          </div>
                        </div>
                        <div className="h-20 bg-gradient-to-r from-white to-gray-900 rounded-md"></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Color Scheme</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div
                        className={`border rounded-lg p-2 cursor-pointer dark:border-gray-700 ${colorScheme === "emerald" ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setColorScheme("emerald")}
                      >
                        <div className="h-10 bg-emerald-500 rounded-md"></div>
                        <div className="text-center mt-2 text-sm font-medium">Emerald</div>
                      </div>
                      <div
                        className={`border rounded-lg p-2 cursor-pointer dark:border-gray-700 ${colorScheme === "blue" ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setColorScheme("blue")}
                      >
                        <div className="h-10 bg-blue-500 rounded-md"></div>
                        <div className="text-center mt-2 text-sm font-medium">Blue</div>
                      </div>
                      <div
                        className={`border rounded-lg p-2 cursor-pointer dark:border-gray-700 ${colorScheme === "purple" ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setColorScheme("purple")}
                      >
                        <div className="h-10 bg-purple-500 rounded-md"></div>
                        <div className="text-center mt-2 text-sm font-medium">Purple</div>
                      </div>
                      <div
                        className={`border rounded-lg p-2 cursor-pointer dark:border-gray-700 ${colorScheme === "orange" ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setColorScheme("orange")}
                      >
                        <div className="h-10 bg-orange-500 rounded-md"></div>
                        <div className="text-center mt-2 text-sm font-medium">Orange</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Language & Region Settings */}
            {activeTab === "language" && (
              <div>
                <h2 className="text-lg font-bold mb-6">Language & Region Settings</h2>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="language"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Language
                    </label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      <option value="english">English</option>
                      <option value="spanish">Spanish</option>
                      <option value="french">French</option>
                      <option value="german">German</option>
                      <option value="chinese">Chinese</option>
                      <option value="japanese">Japanese</option>
                      <option value="korean">Korean</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="currency"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Currency
                    </label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      <option value="usd">USD - US Dollar</option>
                      <option value="eur">EUR - Euro</option>
                      <option value="gbp">GBP - British Pound</option>
                      <option value="jpy">JPY - Japanese Yen</option>
                      <option value="cad">CAD - Canadian Dollar</option>
                      <option value="aud">AUD - Australian Dollar</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                    <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs remain the same */}
            {activeTab === "payment" && (
              <div>
                <h2 className="text-lg font-bold mb-6">Payment Methods</h2>
                {/* Payment methods content */}
                <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <h2 className="text-lg font-bold mb-6">Security Settings</h2>
                {/* Security settings content */}
                <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
