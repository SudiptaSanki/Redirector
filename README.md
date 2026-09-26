# Redirector ⚡

> **A permanent, edge-native redirect layer for links used in resumes, CVs, portfolios, hackathons, and public documents.**

[![Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Database](https://img.shields.io/badge/Database-Cloudflare%20D1-orange?logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Bot Protection](https://img.shields.io/badge/Security-Cloudflare%20Turnstile-blue?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/turnstile/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 The Problem

When you publish links on resumes, CVs, research papers, portfolios, printed cards, or hackathon submissions, URLs often look like:

```
https://rd.example.com/r/github
```

Later, when your username changes, a project migrates, or you publish a new version of your portfolio, every physical or PDF document with your old link becomes broken.

## 💡 The Solution

**Redirector** decouples the public permanent URL from its mutable destination:

```
Published URL (Fixed Forever): https://rd.example.com/r/github
                             │
                             ▼ (Cloudflare Edge 302 Found)
                 Destination: https://github.com/new-username
```

Change the destination at any time from your dashboard. The published link never changes, and old documents keep working seamlessly.

---

## 🏗️ Architecture

```
                                  +---------------------+
                                  |    Vercel Domain    |
                                  |  (Redirects to CF)  |
                                  +----------+----------+
                                             |
                                             | 307 Redirect (vercel.json)
                                             v
+-----------------------------------------------------------------------------------------+
|                               Cloudflare Edge Network                                   |
|                                                                                         |
|  +------------------------+     +--------------------------+     +------------------+   |
|  |    Cloudflare Pages    |     |   Edge Fast Path Worker  |     |  Turnstile WAF   |   |
|  |  (React Vite Frontend) |     |   /r/:slug (Sub-10ms)    |     |  Bot Protection  |   |
|  +-----------+------------+     +------------+-------------+     +--------+---------+   |
|              |                               |                            |             |
|              | API & OAuth                   | 302 Found & Async Event    | Verify      |
|              v                               v                            v             |
|  +----------------------------------------------------------------------------------+   |
|  |                       Cloudflare Pages Functions (Workers)                       |   |
|  |            (/api/auth/*, /api/redirects/*, /api/admin/*, /api/report)            |   |
|  +-------------------------------------------+--------------------------------------+   |
|                                              |                                          |
|                                              v                                          |
|  +----------------------------------------------------------------------------------+   |
|  |                             Cloudflare D1 Database                               |   |
|  |     (users, oauth_accounts, sessions, redirects, versions, events, audit_logs)   |   |
|  +----------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

### Key Engineering Decisions
1. **Lightweight Data Plane**: Public redirects (`GET /r/:slug`) never load React, frontend bundles, or heavy authentication dependencies. Lookups query edge D1 directly with `302 Found`.
2. **Asynchronous Edge Analytics**: Click tracking, geography, browser, and referrer data are written in the background using `context.waitUntil()` without adding latency to the redirect.
3. **Turnstile Bot Shield**: Stops automated scrapers, brute force, and malicious link creation.
4. **Destination History & Versioning**: Every destination edit creates an immutable record in `redirect_versions` for security and rollback auditability.
5. **Separation of Planes**: Public redirect layer, authenticated user control plane, and administrative moderation plane are strictly isolated.

---

## ✨ Features

- ⚡ **Edge-Powered 302 Redirects**: Global sub-10ms response times.
- 🛡️ **Bot Protection**: Cloudflare Turnstile integration on login, link creation, and abuse reporting.
- 🔑 **OAuth Authentication**: Google & GitHub OAuth integration with HTTP-only secure cookie sessions.
- 📱 **QR Code Generation**: Instantly generate and download high-resolution QR codes for any redirect.
- 📊 **Privacy-First Telemetry**: Real-time visit counts, geographic origins, referrers, and device breakdown.
- 👮 **Administration Portal**:
  - Global overview metrics (Total Links, Active vs Suspended, Clicks, Users, Reports)
  - Full link search and moderation (Instant Suspend / Reinstate)
  - User management (Roles, status toggle)
  - Community abuse reporting queue
  - Security audit log trail
- 🚨 **Public Abuse Reporting**: Dedicated reporting form (`/report/:slug`) protected by Turnstile.
- 🎨 **Modern Visuals**: Glassmorphic dark design with dynamic WebGL Lightfall background.

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/SudiptaSanki/Redirector.git
cd Redirector
npm install
```

### 2. Configure Local Secrets
Copy the template files:
```bash
cp .dev.vars.example .dev.vars
cp wrangler.toml.example wrangler.toml
```

### 3. Initialize Local D1 Database
Execute the database schema on your local D1 emulator:
```bash
npm run d1:init:local
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚢 Terminal Deployment to Cloudflare

Deploying to Cloudflare Pages & D1 from your terminal is straightforward using Wrangler:

### 1. Authenticate Wrangler
```bash
npx wrangler login
```

### 2. Create Your D1 Database (Remote)
```bash
npx wrangler d1 create redirector-db
```
*Copy the `database_id` output into your `wrangler.toml` file under `[[d1_databases]]`.*

### 3. Apply Schema to Remote D1
```bash
npm run d1:init:remote
```

### 4. Deploy Application
```bash
npm run deploy
```
Wrangler will build the React SPA, compile the Edge Pages Functions, and output your live deployment URL!

---

## 🔀 Vercel Traffic Redirection

If you previously hosted this repository on Vercel, the included [`vercel.json`](./vercel.json) configuration automatically forwards all incoming Vercel traffic to your Cloudflare deployment with a `307 Temporary Redirect`:

```json
{
  "version": 2,
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "https://YOUR_CLOUDFLARE_DOMAIN/$1",
      "permanent": false
    }
  ]
}
```

---

## 🔒 Security & Privacy

- **Unvalidated Redirect Prevention**: Destination URLs are strictly validated to allow only `http:` and `https:`. Malformed protocols (`javascript:`, `data:`, `file:`) are rejected.
- **Slug Reservation**: Deleted or disabled slugs remain reserved to prevent impersonation or hijacked destinations on previously published documents.
- **CSRF & Cookie Protection**: Session tokens are stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.

---

## 📄 License

MIT © [Sudipta Sanki](https://github.com/SudiptaSanki)
