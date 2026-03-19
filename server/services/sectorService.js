const { analyzeSymbol, analyzeByHorizon, buildMetrics } = require("./analysisEngine");
const fugleClient = require("./fugleClient");
const {
  getUniverse,
  getSectorsWithCounts,
  getSectorSymbols,
  getStock,
  getStockSectors,
  getFallbackStockSectorsSafe
} = require("./stockUniverseService");

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreSearchMatch(query, stock) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const symbol = String(stock.symbol || "").toLowerCase();
  const name = String(stock.name || "").toLowerCase();
  const industry = String(stock.industry || "").toLowerCase();

  if (!normalizedQuery) {
    return -1;
  }

  if (symbol === normalizedQuery) {
    return 100;
  }

  if (name === normalizedQuery) {
    return 95;
  }

  if (symbol.startsWith(normalizedQuery)) {
    return 88;
  }

  if (name.startsWith(normalizedQuery)) {
    return 84;
  }

  if (name.includes(normalizedQuery)) {
    return 72;
  }

  if (industry.includes(normalizedQuery)) {
    return 50;
  }

  if (/^\d+$/.test(normalizedQuery)) {
    const fuzzySymbol = symbol.match(new RegExp(escapeRegExp(normalizedQuery)));
    if (fuzzySymbol) {
      return 40;
    }
  }

  return -1;
}

function lastRow(rows) {
  return rows && rows.length ? rows[rows.length - 1] : null;
}

function pickIndicatorSeries(rows, keyMap) {
  return (rows || []).map((row) => {
    const mapped = { date: row.date };
    Object.entries(keyMap).forEach(([from, to]) => {
      mapped[to] = row[from];
    });
    return mapped;
  });
}

function safeHigh(rows) {
  const values = rows.map((row) => row.high).filter(Number.isFinite);
  return values.length ? Math.max(...values) : null;
}

function safeLow(rows) {
  const values = rows.map((row) => row.low).filter(Number.isFinite);
  return values.length ? Math.min(...values) : null;
}

function tail(rows, count) {
  return rows.slice(-Math.max(1, Math.min(rows.length, count)));
}

function roundIndicator(value) {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : null;
}

function calculateEMA(values, period) {
  if (!values.length) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const ema = [];
  let previous = values[0];

  values.forEach((value, index) => {
    if (index === 0) {
      ema.push(previous);
      return;
    }
    previous = ((value - previous) * multiplier) + previous;
    ema.push(previous);
  });

  return ema;
}

function buildMacdFromCandles(candleRows, options = {}) {
  const closes = candleRows.map((row) => Number(row.close)).filter(Number.isFinite);
  if (closes.length < 35) {
    return [];
  }

  const fastPeriod = options.fast || 12;
  const slowPeriod = options.slow || 26;
  const signalPeriod = options.signal || 9;

  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);
  const macdLineValues = closes.map((_, index) => emaFast[index] - emaSlow[index]);
  const signalLineValues = calculateEMA(macdLineValues, signalPeriod);

  return candleRows.map((row, index) => ({
    date: row.date,
    macdLine: roundIndicator(macdLineValues[index]),
    signalLine: roundIndicator(signalLineValues[index]),
    histogram: roundIndicator(macdLineValues[index] - signalLineValues[index])
  }));
}

function buildKdjFromCandles(candleRows, options = {}) {
  const period = options.period || 9;
  if (candleRows.length < period) {
    return [];
  }

  const rows = [];
  let previousK = 50;
  let previousD = 50;

  candleRows.forEach((row, index) => {
    const window = candleRows.slice(Math.max(0, index - period + 1), index + 1);
    const highs = window.map((item) => Number(item.high)).filter(Number.isFinite);
    const lows = window.map((item) => Number(item.low)).filter(Number.isFinite);
    const close = Number(row.close);

    if (!highs.length || !lows.length || !Number.isFinite(close)) {
      return;
    }

    const highestHigh = Math.max(...highs);
    const lowestLow = Math.min(...lows);
    const denominator = highestHigh - lowestLow;
    const rsv = denominator === 0 ? 50 : ((close - lowestLow) / denominator) * 100;
    const k = ((2 / 3) * previousK) + ((1 / 3) * rsv);
    const d = ((2 / 3) * previousD) + ((1 / 3) * k);
    const j = (3 * k) - (2 * d);

    previousK = k;
    previousD = d;

    rows.push({
      date: row.date,
      k: roundIndicator(k),
      d: roundIndicator(d),
      j: roundIndicator(j)
    });
  });

  return rows;
}

async function getSectors() {
  return getSectorsWithCounts();
}

async function getSectorAnalysis(sectorId, horizon) {
  const sectors = await getSectorsWithCounts();
  const sector = sectors.find((item) => item.id === sectorId) || sectors[0];
  const uniqueSymbols = [...new Set(await getSectorSymbols(sector.id))];
  const items = await Promise.all(uniqueSymbols.map(async (symbol) => {
    const stock = await getStock(symbol);
    return analyzeSymbol(symbol, horizon, { name: stock?.name || symbol });
  }));
  const ranked = items.sort((left, right) => right.analysis.score - left.analysis.score);

  return {
    sector: {
      id: sector.id,
      label: sector.label,
      description: sector.description,
      color: sector.color,
      sourceType: sector.sourceType,
      totalSymbols: uniqueSymbols.length
    },
    horizon,
    generatedAt: new Date().toISOString(),
    dataSource: items.some((item) => item.metrics.errorHint) ? "fallback+fugle" : "fugle",
    stocks: ranked
  };
}

function buildTimelineWindows(candleRows, macdRows, kdjRows) {
  const periods = {
    "1d": { points: 1 },
    "3d": { points: 3 },
    "5d": { points: 5 },
    "1m": { points: 22 },
    "3m": { points: 66 },
    "6m": { points: 132 },
    "1y": { points: 264 }
  };

  return Object.entries(periods).reduce((accumulator, [key, value]) => {
    const subset = tail(candleRows, value.points);
    const macdSubset = tail(macdRows, value.points);
    const kdjSubset = tail(kdjRows, value.points);
    const latestWindowMacd = lastRow(macdSubset);
    const latestWindowKdj = lastRow(kdjSubset);
    accumulator[key] = {
      close: lastRow(subset)?.close || null,
      high: safeHigh(subset),
      low: safeLow(subset),
      volume: lastRow(subset)?.volume || null,
      macdLine: latestWindowMacd?.macdLine || null,
      signalLine: latestWindowMacd?.signalLine || null,
      histogram: latestWindowMacd?.histogram || null,
      k: latestWindowKdj?.k || null,
      d: latestWindowKdj?.d || null,
      j: latestWindowKdj?.j || null
    };
    return accumulator;
  }, {});
}

async function getStockDetail(symbolInput) {
  const symbol = String(symbolInput || "").trim();
  if (!/^\d{4}$/.test(symbol)) {
    const error = new Error("Invalid stock symbol");
    error.status = 400;
    throw error;
  }

  const stockMeta = await getStock(symbol);
  const metrics = await buildMetrics(symbol);
  const [quoteResult, candlesResult, macdResult, kdjResult, universe] = await Promise.all([
    fugleClient.getQuote(symbol)
      .then((value) => ({ ok: true, value, error: null }))
      .catch((error) => ({ ok: false, value: null, error })),
    fugleClient.getHistoricalCandles(symbol, { daysBack: 360 })
      .then((value) => ({ ok: true, value, error: null }))
      .catch((error) => ({ ok: false, value: null, error })),
    fugleClient.getMACD(symbol, { daysBack: 200 })
      .then((value) => ({ ok: true, value, error: null }))
      .catch((error) => ({ ok: false, value: null, error })),
    fugleClient.getKDJ(symbol, { daysBack: 200 })
      .then((value) => ({ ok: true, value, error: null }))
      .catch((error) => ({ ok: false, value: null, error })),
    getUniverse()
  ]);

  const fugleErrors = [quoteResult, candlesResult, macdResult, kdjResult]
    .map((result) => result.error)
    .filter(Boolean);

  if (fugleErrors.length && fugleErrors.every((error) => error.code === "MISSING_FUGLE_API_KEY")) {
    const error = new Error("Vercel 尚未設定 FUGLE_API_KEY，請到 Project Settings > Environment Variables 補上後重新部署。");
    error.status = 503;
    error.code = "MISSING_FUGLE_API_KEY";
    throw error;
  }

  const quote = quoteResult.value;
  const candles = candlesResult.value;
  const macd = macdResult.value;
  const kdj = kdjResult.value;

  const candleRows = candles?.data || [];
  const macdRows = (macd?.data && macd.data.length) ? macd.data : buildMacdFromCandles(candleRows);
  const kdjRows = (kdj?.data && kdj.data.length) ? kdj.data : buildKdjFromCandles(candleRows);
  const latestCandle = lastRow(candleRows);
  const latestMacd = lastRow(macdRows);
  const latestKdj = lastRow(kdjRows);

  if (!stockMeta && !quote && candleRows.length === 0) {
    const error = new Error("Stock symbol not found");
    error.status = 404;
    throw error;
  }

  if (!quote && candleRows.length === 0 && macdRows.length === 0 && kdjRows.length === 0) {
    const firstError = fugleErrors[0];
    const error = new Error(firstError?.message || "目前無法取得這支股票的即時與技術指標資料。");
    error.status = firstError?.status || 503;
    error.detail = firstError?.detail || null;
    throw error;
  }

  const sectors = await getStockSectors(symbol);
  const windows = buildTimelineWindows(candleRows, macdRows, kdjRows);
  const horizonScores = {
    short: analyzeByHorizon(metrics, "short"),
    mid: analyzeByHorizon(metrics, "mid"),
    long: analyzeByHorizon(metrics, "long")
  };

  return {
    symbol,
    profile: {
      name: stockMeta?.name || quote?.name || symbol,
      market: stockMeta?.market || null,
      industry: stockMeta?.industry || null,
      sectors: sectors.length ? sectors : getFallbackStockSectorsSafe(symbol),
      universeSource: universe.source
    },
    quote: {
      name: stockMeta?.name || quote?.name || symbol,
      closePrice: quote?.closePrice ?? latestCandle?.close ?? null,
      openPrice: quote?.openPrice ?? latestCandle?.open ?? null,
      highPrice: quote?.highPrice ?? latestCandle?.high ?? null,
      lowPrice: quote?.lowPrice ?? latestCandle?.low ?? null,
      previousClose: quote?.previousClose ?? null,
      change: quote?.change ?? null,
      changePercent: quote?.changePercent ?? null,
      tradeVolume: quote?.total?.tradeVolume ?? latestCandle?.volume ?? null,
      tradeDate: quote?.date ?? latestCandle?.date ?? null
    },
    latestIndicators: {
      macd: latestMacd ? {
        macdLine: latestMacd.macdLine,
        signalLine: latestMacd.signalLine,
        histogram: latestMacd.histogram
      } : null,
      kdj: latestKdj ? {
        k: latestKdj.k,
        d: latestKdj.d,
        j: latestKdj.j
      } : null
    },
    horizonScores,
    windows,
    series: {
      candles: pickIndicatorSeries(candleRows, { close: "close", volume: "volume" }),
      macd: pickIndicatorSeries(macdRows, {
        macdLine: "macdLine",
        signalLine: "signalLine",
        histogram: "histogram"
      }),
      kdj: pickIndicatorSeries(kdjRows, {
        k: "k",
        d: "d",
        j: "j"
      })
    }
  };
}

async function searchStocks(queryInput, horizon = "short", limit = 8) {
  const query = String(queryInput || "").trim();
  if (!query) {
    return [];
  }

  const universe = await getUniverse();
  const ranked = Object.values(universe.stocks)
    .map((stock) => ({
      stock,
      rank: scoreSearchMatch(query, stock)
    }))
    .filter((item) => item.rank >= 0)
    .sort((left, right) => {
      if (right.rank !== left.rank) {
        return right.rank - left.rank;
      }
      return String(left.stock.symbol).localeCompare(String(right.stock.symbol), "zh-Hant");
    })
    .slice(0, Math.max(1, Math.min(Number(limit) || 8, 12)));

  const items = await Promise.all(ranked.map(async ({ stock }) => {
    const metrics = await buildMetrics(stock.symbol);
    const analysis = analyzeByHorizon(metrics, horizon);
    const sectors = await getStockSectors(stock.symbol);

    return {
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      market: stock.market || null,
      industry: stock.industry || null,
      stars: analysis.stars,
      score: analysis.score,
      biasLabel: analysis.biasLabel,
      sectors: sectors.slice(0, 3)
    };
  }));

  return items;
}

module.exports = {
  getSectors,
  getSectorAnalysis,
  getStockDetail,
  searchStocks
};
