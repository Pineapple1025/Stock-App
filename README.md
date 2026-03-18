# Taiwan Stock Analyzer

This project is a Taiwan stock analysis website built around Fugle API data.

## What It Does

- Sector-based ranking view
- Short / mid / long horizon analysis
- Single-stock detail page
- MACD / KDJ / volume snapshots for:
  - 1D
  - 3D
  - 5D
  - 1M
  - 3M
  - 6M
  - 1Y
- Chart-ready detail view for:
  - price
  - volume
  - MACD
  - KDJ

## Current Architecture

- `public/`
  - `index.html`: main UI
  - `styles.css`: visual design
  - `app.js`: frontend logic, detail rendering, chart rendering
- `server/`
  - `index.js`: Express server and API routes
  - `config.js`: runtime config
  - `data/sectors.js`: sector definitions, fallback stock data, concept mappings
  - `services/fugleClient.js`: Fugle API wrapper
  - `services/analysisEngine.js`: scoring engine
  - `services/sectorService.js`: sector analysis and stock detail assembly
  - `services/stockUniverseService.js`: official-data-backed stock universe loader and cache

## Main API Routes

- `GET /api/health`
- `GET /api/sectors`
- `GET /api/analysis?sector=ai&horizon=short`
- `GET /api/stock/:symbol`

## Stock Universe Strategy

The project now uses a two-layer stock universe approach:

1. Official-data-backed universe
   - fetched from TWSE open data
   - used to expand industry sectors toward full stock coverage
2. Curated concept memberships
   - used for AI, green energy, defense & aerospace, and other concept sectors

If official data is unavailable, the app falls back to local sector and stock definitions.

## Model Roadmap

- Short term: `TCN-Transformer / MASTER`
- Mid term: `XGBoost / LightGBM`
- Long term: `Bayesian Neural Networks`

The current build still uses rule-based scoring for UI delivery and explanation.

## Fugle Endpoints Used

- `intraday/quote`
- `historical/candles`
- `technical/sma`
- `technical/rsi`
- `technical/macd`
- `technical/kdj`

## Environment

Create `.env` from `.env.example`:

```env
FUGLE_API_KEY=your-key
PORT=3000
```

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Current Gaps

- Full TWSE / TPEX bulk import is not fully normalized yet
- Fundamental data such as revenue / EPS / ROE is still partly fallback-based
- Runtime verification was limited by environment constraints during development
