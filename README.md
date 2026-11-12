# Community Waste Reporting and Collection Tracking System ("ชุมชนสะอาด")

Team Larb Lamphoon · Introduction to Software Engineering (15031001)
(ภาษาไทย: see [README.th.md](README.th.md))

A web app where residents report waste spots, receive a tracking number (e.g. `WS-0001`) and follow the report until the waste is collected. Collection officers see a queue sorted by urgency and update each job's status. Administrators see summary figures, areas with repeated reports, and can export a CSV.

## Features

| Role | Can do |
|---|---|
| Citizen | Register / log in, report waste with photo and GPS, see notifications when status changes |
| Anyone (no login) | Look up a report by its exact tracking number |
| Collection officer | View the open-job queue (most urgent first), accept a job, mark it collected (optional after-photo) |
| Administrator | View totals by status, repeated-report areas, all reports, export CSV |

## Tech stack
- Node.js + Express
- SQLite database (`better-sqlite3`), stored in `data.db`
- Plain HTML / CSS / JavaScript frontend (`public/`), Thai UI

## Security measures
- Passwords hashed with bcrypt (cost 12); minimum length and complexity enforced
- Session cookie is `httpOnly`, `SameSite=strict`, and `secure` when `NODE_ENV=production`
- Rate limiting on login and tracking lookups
- Prepared statements for every SQL query
- CSRF protection via a required custom header; security headers and CSP via helmet
- Uploads limited to JPG/PNG/WebP, max 5 MB, random file names
- Tracking lookup requires the exact number and returns no personal data
- CSV export protected against formula injection
- Self-registration creates citizens only; officer/admin accounts are created from the command line

## Getting started

Requires [Node.js](https://nodejs.org) (LTS).

```bash
git clone https://github.com/Adichat-dev/Larb-Lamphoon.git
cd Larb-Lamphoon
npm install
```

Create staff accounts (once; password at least 8 characters):

```bash
node server.js --create-staff admin admin@example.com 'your-password' "Admin"
node server.js --create-staff officer officer@example.com 'your-password' "Officer"
```

Set `SESSION_SECRET` (random string, 32+ characters) and start the server:

```bash
# generate a value
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# macOS / Linux
export SESSION_SECRET="<value>"
# Windows PowerShell
$env:SESSION_SECRET="<value>"

node server.js
```
add cloudflared

Open [http://localhost:3000](https://expected-craft-trial-varieties.trycloudflare.com)

> In development, if `SESSION_SECRET` is not set, a temporary random one is used, so everyone is logged out whenever the server restarts.

## Project structure

```
server.js        server, API, database schema
package.json
public/
  index.html
  app.js         all pages (citizen / officer / admin)
  style.css
```
`data.db` and `uploads/` are created automatically and are excluded from Git (see `.gitignore`).

## Known limitations
- No Google sign-in, email verification or password reset
- Notifications are in-app only (no real SMS / LINE / e-mail)
- Sessions are stored in memory, which is fine for development and demos; use a persistent session store in production
- Use HTTPS and set `NODE_ENV=production` when deploying

## Team
- 6931503083 Adichat Phontaweekordphon
- 6931503075 Siwakorn Chailak
- 6931503068 Rungniran Jaroenphan
- 6931503087 Akkaracha Thammakunta
