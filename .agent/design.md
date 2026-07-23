## 5. Frontend Code Analysis (Current State)

> Analysed on 2026-07-21. Based on the Next.js App Router structure under `app/(dashboard)/`.

### 5.1 Layout Shell

| File | Role |
|---|---|
| [app/layout.tsx](file:///e:/Development/Wave/app/layout.tsx) | Root HTML shell — sets fonts, global CSS, theme provider |
| [app/(dashboard)/layout.tsx](file:///e:/Development/Wave/app/(dashboard)/layout.tsx) | Authenticated shell — top header bar, sidebar, notification bell, auth guard (`sessionStorage` check → redirect `/login`) |
| [components/side-navigation.tsx](file:///e:/Development/Wave/components/side-navigation.tsx) | Sidebar nav component with links: Dashboard, Wallet, Swap, Settings |

-

### 5.2 Sidebar Routes — Alignment with PRD

#### Dashboard → Module B (Market Console)
- **Route:** `/dashboard`
- **Page:** [app/(dashboard)/dashboard/page.tsx](file:///e:/Development/Wave/app/(dashboard)/dashboard/page.tsx)
- **Components used:**
  - [components/dashboard/stats-overview.tsx](file:///e:/Development/Wave/components/dashboard/stats-overview.tsx) — Global Cap & 24h Volume cards
  - [components/dashboard/live-market-table.tsx](file:///e:/Development/Wave/components/dashboard/live-market-table.tsx) — Live price ticker table
- **Status:** Structure matches PRD. Needs real WebSocket price stream wired up.

#### Wallet → Module C + D + E (Ledger + Swap + Simulation)
- **Route:** `/wallet`
- **Page:** [app/(dashboard)/wallet/page.tsx](file:///e:/Development/Wave/app/(dashboard)/wallet/page.tsx)
- **Internal tabs:** Overview · Deposit · Withdraw · Transfer · Trade (Instant Swap)
- **Components used:**
  - [components/wallet/wallet-balance.tsx](file:///e:/Development/Wave/components/wallet/wallet-balance.tsx) — Balance display
  - [components/wallet/asset-distribution.tsx](file:///e:/Development/Wave/components/wallet/asset-distribution.tsx) — Donut chart (Module C)
  - [components/wallet/transaction-history.tsx](file:///e:/Development/Wave/components/wallet/transaction-history.tsx) — Ledger table (Module C)
  - [components/wallet/instant-swap.tsx](file:///e:/Development/Wave/components/wallet/instant-swap.tsx) — Swap panel with 5s countdown (Module D)
  - [components/wallet/quick-actions.tsx](file:///e:/Development/Wave/components/wallet/quick-actions.tsx) — Shortcut buttons
  - [components/wallet/recent-activity.tsx](file:///e:/Development/Wave/components/wallet/recent-activity.tsx) — Recent txn feed
- **Status:** Deposit & Withdraw tabs exist but use static placeholder values. `Transfer` tab is not in PRD — can be removed or kept as internal account move. Needs backend API wiring.

#### Settings → Module F (Settings Mock)
- **Route:** `/settings`
- **Page:** [app/(dashboard)/settings/page.tsx](file:///e:/Development/Wave/app/(dashboard)/settings/page.tsx)
- **Sub-sections:** Account · Appearance · Security (Change Password)
- **Status:** Interactive UI with live user session integration, theme settings, and fully functional password update form.

---

### 5.3 Auth Pages

| File | Purpose |
|---|---|
| [app/login/page.tsx](file:///e:/Development/Wave/app/login/page.tsx) | Login form — sets `sessionStorage.isLoggedIn` flag on success |
| [app/register/page.tsx](file:///e:/Development/Wave/app/register/page.tsx) | Registration form |
| [app/page.tsx](file:///e:/Development/Wave/app/page.tsx) | Root redirect → `/login` |

**Note:** Auth currently uses a `sessionStorage` flag as a placeholder. PRD specifies real JWT tokens injected into HTTP headers and WebSocket handshakes — this needs replacing with a proper JWT flow.

---

### 5.4 Summary: What Needs Doing

| Priority | Item |
|---|---|
| 🔴 High | Wire Dashboard live tickers to WebSocket (Service 2) |
| 🔴 High | Wire Wallet Deposit/Withdraw/Swap tabs to backend REST API (Service 1) |
| 🔴 High | Replace `sessionStorage` auth flag with real JWT token handling |
| 🟡 Medium | Implement notification bell WebSocket listener (Service 4 push events) |

### 5.5 Top Search Bar Implementation (`HeaderSearch`)

* **New Component:** Added `components/header-search.tsx` and integrated it into `app/(dashboard)/layout.tsx`.
* **Live Market Feed:** Uses `useMarketStream()` WebSocket for real-time asset prices and 24h changes (BTC, ETH, USDT, BNB, XRP).
* **Categorized Search Overlay:**
  **Live Market Crypto:** Real-time price tracking with direct click-to-swap navigation (`/swap?from=...`).
   **Navigation:** Quick routes to *Dashboard*, *Wallet Ledger*, *Instant Swap*, and *Settings*.
   **Quick Actions:** Direct shortcuts for *Deposit Funds* and *Instant Swap*.
* **UX & Accessibility:** Supports global `Ctrl+K` / `⌘K` focus hotkey, `↑` / `↓` / `Enter` keyboard navigation, `Esc` dismiss, and click-outside closing.