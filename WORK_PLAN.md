# Stock App Progress Tracker

## Project Summary

- Project: Taiwan stock analysis website
- Market scope: Taiwan stocks only
- Data source: Fugle API
- Main views:
  - Sector-based ranking view
  - Single-stock detail view
- Model roadmap:
  - Short term: TCN-Transformer / MASTER
  - Mid term: XGBoost / LightGBM
  - Long term: Bayesian Neural Networks

## Status Legend

- `TODO`: not started
- `IN PROGRESS`: currently being built
- `BLOCKED`: waiting for data, tool, or decision
- `DONE`: completed

## Current Snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Frontend structure | `DONE` | Main sector page and stock detail section exist |
| Backend API skeleton | `DONE` | Express routes and Fugle client are in place |
| Fugle API key setup | `DONE` | `.env` created |
| Sector data structure | `DONE` | Sector, stock, and mapping structure added |
| Single stock detail API | `DONE` | `/api/stock/:symbol` added |
| Multi-window MACD/KDJ/volume | `DONE` | Window snapshots added |
| Full stock universe import | `TODO` | Still using manually curated lists |
| Real financial data enrichment | `TODO` | Revenue, EPS, ROE still partly fallback |
| Model training pipeline | `TODO` | Not started |
| Deployment | `TODO` | Not started |

## Phase 1: Product and Data Scope

### Goals

- [x] Confirm Taiwan stock market only
- [x] Confirm major sector list
- [x] Confirm Fugle API key available
- [x] Confirm short / mid / long model direction
- [ ] Finalize exact definition of bullish target by horizon
- [ ] Finalize whether ranking is absolute return or benchmark-relative return
- [ ] Finalize whether stop-loss / risk grading is required

### Output

- Status: `IN PROGRESS`
- Owner: project
- Blockers:
  - Bullish label definition still needs final rule

## Phase 2: Data Architecture

### Goals

- [x] Create sector master data
- [x] Create stock master data
- [x] Create sector-to-stock mapping structure
- [x] Support multi-sector membership for a stock
- [ ] Add source metadata for each stock entry
- [ ] Add ranking priority / popularity field
- [ ] Add import-ready CSV or JSON format
- [ ] Add full TWSE / TPEX universe import process

### Output

- Status: `IN PROGRESS`
- Main files:
  - `server/data/sectors.js`
- Next step:
  - Replace manually maintained lists with bulk-import structure

## Phase 3: Backend API

### Goals

- [x] Create health check endpoint
- [x] Create sector list endpoint
- [x] Create sector analysis endpoint
- [x] Create single stock detail endpoint
- [x] Add Fugle quote fetch
- [x] Add historical candles fetch
- [x] Add SMA fetch
- [x] Add RSI fetch
- [x] Add MACD fetch
- [x] Add KDJ fetch
- [ ] Add stronger API error normalization
- [ ] Add caching layer
- [ ] Add rate-limit protection
- [ ] Add bulk background refresh flow

### Output

- Status: `IN PROGRESS`
- Main files:
  - `server/index.js`
  - `server/services/fugleClient.js`
  - `server/services/sectorService.js`
  - `server/services/analysisEngine.js`

## Phase 4: Frontend Experience

### Goals

- [x] Build sector list UI
- [x] Build short / mid / long horizon switch
- [x] Show ranked stock cards
- [x] Add single stock search
- [x] Add stock detail summary
- [x] Show latest MACD / KDJ snapshot
- [x] Show 1D / 3D / 5D / 1M / 3M / 6M / 1Y windows
- [x] Allow clicking stock card to load detail
- [ ] Add chart area for candles / MACD / KDJ / volume
- [ ] Add loading states for detail panel
- [ ] Add empty / invalid symbol states
- [ ] Add mobile polish pass

### Output

- Status: `IN PROGRESS`
- Main files:
  - `public/index.html`
  - `public/styles.css`
  - `public/app.js`

## Phase 5: Scoring and Explanation

### Goals

- [x] Create short-term scoring logic
- [x] Create mid-term scoring logic
- [x] Create long-term scoring logic
- [x] Convert scores to 1-5 stars
- [x] Add bullish reasons
- [x] Add risk notes
- [x] Add confidence field
- [ ] Make weights configurable
- [ ] Add benchmark-relative ranking mode
- [ ] Add explanation layer tied to future ML outputs

### Output

- Status: `IN PROGRESS`

## Phase 6: Model Pipeline

### Short Term

- [ ] Define training label for 5 / 10 / 20 trading days
- [ ] Build TCN-Transformer training dataset
- [ ] Evaluate whether MASTER is better for input design
- [ ] Create training script
- [ ] Create validation report

### Mid Term

- [ ] Define training label for 1 to 3 months
- [ ] Build tabular feature dataset
- [ ] Train XGBoost baseline
- [ ] Train LightGBM comparison model
- [ ] Generate feature importance report

### Long Term

- [ ] Define training label for 3 to 12 months
- [ ] Build long-horizon fundamental feature set
- [ ] Train Bayesian Neural Network baseline
- [ ] Add uncertainty output
- [ ] Create validation report

### Output

- Status: `TODO`

## Phase 7: Financial and Fundamental Data Enrichment

### Goals

- [ ] Confirm Fugle coverage for revenue / EPS / ROE / valuation fields
- [ ] Add additional data source if Fugle alone is not enough
- [ ] Replace fallback values for revenue / EPS / ROE
- [ ] Add institutional flow data if available
- [ ] Add valuation metrics pipeline

### Output

- Status: `TODO`
- Risk:
  - This phase depends on actual API plan and available fields

## Phase 8: Deployment and Ops

### Goals

- [ ] Install Node.js on target environment
- [ ] Run `npm install`
- [ ] Run local server verification
- [ ] Add production env template
- [ ] Prepare GitHub repo sync
- [ ] Prepare deployment target
- [ ] Add logging and monitoring basics

### Output

- Status: `BLOCKED`
- Blockers:
  - Current workspace does not have Node.js installed
  - Git repository is not initialized in this folder yet

## Immediate Next Tasks

### Priority 1

- [ ] Replace curated sector lists with import-ready full stock universe structure
- [ ] Add chart-ready data blocks for stock detail page
- [ ] Add invalid symbol and loading UI states

### Priority 2

- [ ] Verify actual Fugle field coverage for fundamentals
- [ ] Add caching strategy for repeated API calls
- [ ] Add popularity / ranking field to stock master data

### Priority 3

- [ ] Start model dataset design for short-term forecast
- [ ] Start benchmark definition for ranking logic

## Decisions Needed From User

- [ ] Define bullish target rule for short / mid / long horizon
- [ ] Decide whether ranking is absolute return or benchmark-relative
- [ ] Decide whether to show only top 20 per concept sector or all mapped stocks
- [ ] Decide whether to add charts in the next build step

## Notes

- The current environment does not have Node.js, so runtime verification has not been completed here.
- The current sector universe is structured for maintainability, but not yet a full imported TWSE / TPEX universe.
- The single-stock detail page already supports:
  - basic quote
  - short / mid / long scores
  - latest MACD / KDJ
  - 1D / 3D / 5D / 1M / 3M / 6M / 1Y snapshots
