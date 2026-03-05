# SEC Insider Tracker

A mobile app that delivers official SEC insider trading data (Form 4 filings) in a clean, fast interface — sourced directly from EDGAR with zero third-party aggregators.

## Tech Stack

| Layer | Tech | Cost |
|---|---|---|
| Mobile frontend | React Native + Expo | Free |
| Navigation | React Navigation | Free |
| HTTP client | Axios | Free |
| Backend | Node.js + Express | Free |
| Database | MongoDB Atlas | Free (512MB) |
| Hosting | Render / Railway | Free tier |
| Data source | SEC EDGAR APIs | Free forever |

---

## Project Structure

```
sec-insider-tracker/
├── backend/         Node.js + Express API
│   ├── src/
│   │   ├── index.js           Entry point + cron
│   │   ├── routes/            Express route handlers
│   │   ├── controllers/       Business logic
│   │   ├── models/            Mongoose schemas
│   │   ├── services/
│   │   │   ├── secApiService.js     SEC EDGAR fetcher
│   │   │   ├── ingestionService.js  Data pipeline
│   │   │   └── form4Parser.js       XML parser
│   │   └── utils/
│   └── scripts/               Standalone ingest scripts
└── frontend/        React Native + Expo
    ├── App.js
    └── src/
        ├── screens/           HomeScreen, SearchResults, Detail, About
        ├── components/        TransactionCard, SearchBar, StatsBar, etc.
        ├── navigation/        React Navigation setup
        ├── services/          API client + AsyncStorage cache
        ├── hooks/             usePaginatedData
        └── utils/             theme.js, formatters.js
```

---

## Setup Guide

### 1. MongoDB Atlas (Free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → Create free account
2. Create a free M0 cluster (512MB)
3. Under **Database Access**: create a user with password
4. Under **Network Access**: Add IP `0.0.0.0/0` (allow all, fine for dev)
5. Click **Connect** → **Drivers** → copy the connection string
6. Replace `<username>` and `<password>` in the string

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and fill in your env
cp .env.example .env
# Edit .env with your MONGODB_URI

# Start dev server
npm run dev

# Trigger initial data ingest manually (optional)
npm run ingest
```

The server will auto-trigger ingestion on first start if DB is empty.

**Backend API endpoints:**
- `GET /api/transactions/recent` — Latest filings (paginated)
- `GET /api/transactions/ticker/:ticker` — By stock ticker
- `GET /api/transactions/insider/:name` — By insider name
- `GET /api/transactions/stats/:ticker` — Buy/sell summary stats
- `GET /api/search?q=AAPL&type=all` — Unified search
- `GET /api/search/autocomplete?q=app` — Ticker/company suggestions
- `GET /health` — Health check

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy env file
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your backend URL

# Start Expo
npm start
```

For testing on a physical device: set `EXPO_PUBLIC_API_URL` to your machine's **LAN IP** (not localhost), e.g. `http://192.168.1.100:3000/api`

### 4. Deploying the Backend Free (Render)

1. Push `backend/` to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect GitHub repo
4. Set environment variables (MONGODB_URI, NODE_ENV=production)
5. Deploy — free tier URL will be provided
6. Update frontend `.env` with that URL

---

## Data Ingestion

The backend has three ingestion modes:

| Command | Description |
|---|---|
| `npm run ingest` | Ingest last 30 days of Form 4 filings |
| `npm run ingest quarterly 2024 4` | Ingest full Q4 2024 bulk dataset |
| Cron (auto) | Runs daily at 2am UTC, ingests last 2 days |

Data flows:
1. Fetch Form 4 filing list from EDGAR EFTS search API
2. For each filing: download and parse the XML
3. Parse insider details, transaction details, company info
4. Upsert into MongoDB (idempotent — safe to re-run)

---

## SEC Data Sources (All Free)

| Source | URL |
|---|---|
| EFTS search (filings) | `https://efts.sec.gov/LATEST/search-index` |
| EDGAR submissions | `https://data.sec.gov/submissions/CIK{cik}.json` |
| Company tickers | `https://www.sec.gov/files/company_tickers.json` |
| Full-index quarterly | `https://www.sec.gov/Archives/edgar/full-index/{year}/QTR{n}/form.idx` |

No API key required. SEC only asks for a descriptive `User-Agent` header (included in the code).

---

## Academic Context

This project implements the proposal submitted for the Faculty of Engineering & Technology, Department of Computing. It demonstrates:

- **API Integration**: SEC EDGAR REST APIs + XML parsing
- **Mobile Development**: React Native cross-platform (iOS + Android)
- **Data Engineering**: Scheduled ingestion, bulk parsing, upsert pipelines
- **Backend Architecture**: REST API, rate limiting, caching, error handling
- **Ethical Data Presentation**: Primary sources only, no commentary, SEC filing links

---

## License

MIT — Free to use and modify.
