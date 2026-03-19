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
  const macdRows = macd?.data || [];
  const kdjRows = kdj?.data || [];
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

module.exports = {
  getSectors,
  getSectorAnalysis,
  getStockDetail
};
