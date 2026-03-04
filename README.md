# Email Security Analyzer

[Leer en Español](README.es.md)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma&logoColor=white)
![Gmail API](https://img.shields.io/badge/Gmail_API-v1-EA4335?logo=gmail&logoColor=white)

A full-stack application for email security analysis via Gmail. It uses multiple analysis engines (headers, URLs, LLM-powered content, attachments) to detect phishing, social engineering, and other threats.

Thesis project - University

## Architecture

```
email-analyzer/
├── backend/          # REST API (Express + Prisma + SQLite)
│   ├── src/
│   │   ├── config/         # Environment variables, database
│   │   ├── controllers/    # Endpoints (emails, dashboard, reports, auth)
│   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # Business logic
│   │   │   ├── analyzer.service.ts           # Main orchestrator
│   │   │   ├── header-analyzer.service.ts    # SPF/DKIM/DMARC
│   │   │   ├── url-analyzer.service.ts       # Safe Browsing + VirusTotal
│   │   │   ├── content-analyzer.service.ts   # LLM via OpenRouter
│   │   │   ├── attachment-analyzer.service.ts # Attachment analysis
│   │   │   ├── threat-scorer.service.ts      # Composite scoring
│   │   │   ├── scan-progress.service.ts      # Real-time progress
│   │   │   ├── gmail.service.ts              # Gmail API client
│   │   │   └── scheduler.service.ts          # Automated scans (cron)
│   │   └── utils/          # Email parser, logger
│   └── prisma/             # Schema and migrations
└── frontend/         # SPA (React + Vite + Tailwind)
    └── src/
        ├── api/            # HTTP client (Axios)
        ├── components/     # UI components
        │   ├── layout/     # Sidebar, Header (responsive)
        │   ├── dashboard/  # Cards, charts (Recharts)
        │   ├── emails/     # List, detail, filters, progress
        │   └── analysis/   # Analysis type views
        ├── hooks/          # React Query hooks
        ├── pages/          # Main pages
        └── context/        # AuthContext (Google OAuth)
```

## Features

### Multi-layer security analysis
- **Headers (SPF/DKIM/DMARC)** — Sender authentication validation
- **URLs** — Verification against Google Safe Browsing and VirusTotal
- **Content (LLM)** — AI-powered phishing and social engineering detection
- **Attachments** — Suspicious file type and hash analysis via VirusTotal

### Composite threat score
Each email receives a score from 0 to 100 based on weighted components:
| Component   | Weight |
|-------------|--------|
| Headers     | 20%    |
| URLs        | 30%    |
| Content     | 30%    |
| Attachments | 20%    |

Levels: `safe` (0-15) | `low` (16-35) | `medium` (36-55) | `high` (56-75) | `critical` (76-100)

### Real-time scan progress
- Scans run in the background (non-blocking UI)
- Polling every 1s shows: progress bar, current email, retry attempts, threats found
- Automatic retry with exponential backoff for 429/502/503 errors

### Interactive dashboard
- Summary cards (total emails, threats, average score, last scan)
- Threat trend chart (30 days)
- Threat level distribution (pie chart)

### Responsive UI
- Desktop: fixed sidebar + email table
- Mobile: hamburger menu + email cards

### Other features
- Google OAuth 2.0 authentication
- Scheduled automatic scans (configurable cron)
- JSON report export
- Email filtering and search
- Pagination

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- Google Cloud account with Gmail API enabled
- OAuth 2.0 credentials configured

### API Keys (optional but recommended)
| Service | Purpose |
|---------|---------|
| [Google Safe Browsing](https://developers.google.com/safe-browsing) | Malicious URL verification |
| [VirusTotal](https://www.virustotal.com/gui/my-apikey) | URL and attachment hash analysis |
| [OpenRouter](https://openrouter.ai/keys) | LLM-powered content analysis |

## Installation

```bash
# Clone repository
git clone https://github.com/AlbertoEJ/Email-Analyzer.git
cd Email-Analyzer

# Install dependencies (monorepo with workspaces)
npm install

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials (see next section)

# Create database and run migrations
npm run db:migrate

# Start in development mode (backend + frontend simultaneously)
npm run dev
```

The backend runs on `http://localhost:3001` and the frontend on `http://localhost:5173`.

## Environment Variables

Create `backend/.env` with:

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google OAuth 2.0 (REQUIRED)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback

# Encryption key for OAuth tokens (64 hex characters)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-char-hex-key

# Google Safe Browsing API (optional)
SAFE_BROWSING_API_KEY=

# VirusTotal API (optional)
VIRUSTOTAL_API_KEY=

# OpenRouter - LLM content analysis (optional)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free

# Scheduled scan cron expression (default: every 6 hours)
SCAN_CRON=0 */6 * * *
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend and frontend in development mode |
| `npm run dev:backend` | Backend only |
| `npm run dev:frontend` | Frontend only |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |

## Tech Stack

### Backend
- **Express** — HTTP server
- **Prisma** — ORM with SQLite
- **googleapis** — Official Gmail API client
- **OpenAI SDK** — OpenRouter (LLM) communication
- **Zod** — Environment variable validation
- **Pino** — Structured logger
- **node-cron** — Scheduled scans
- **Cheerio** — HTML parsing in emails
- **Helmet** — Security headers
- **express-rate-limit** — Abuse protection

### Frontend
- **React 19** — UI library
- **Vite** — Bundler and dev server
- **Tailwind CSS** — Utility-first styling
- **TanStack React Query** — Server state management
- **React Router** — SPA navigation
- **Recharts** — Interactive charts
- **Lucide React** — Icons
- **Axios** — HTTP client
- **date-fns** — Date formatting

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Gmail API**
4. Configure **OAuth consent screen** (type: External)
   - Add scope: `https://www.googleapis.com/auth/gmail.readonly`
5. Create **OAuth 2.0 credentials** (type: Web Application)
   - Authorized redirect URI: `http://localhost:3001/api/auth/callback`
6. Copy Client ID and Client Secret to your `.env`

## License

This project is licensed under [AGPL-3.0](LICENSE).
