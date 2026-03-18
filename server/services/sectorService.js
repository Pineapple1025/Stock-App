const { SECTORS, getSectorSymbols, getStock, getStockSectors } = require("../data/sectors");
const { analyzeSymbol, analyzeByHorizon, buildMetrics } = require("./analysisEngine");
const fugleClient = require("./fugleClient");

function getSectors() {
  return SECTORS;
}

function getSectorById(id) {
  return SECTORS.find((sector) => sector.id === id);
}

async function getSectorAnalysis(sectorId, horizon) {
  const sector = getSectorById(sectorId) || SECTORS[0];
  const uniqueSymbols = [...new Set(getSectorSymbols(sector.id))];
  const items = await Promise.all(uniqueSymbols.map((symbol) => analyzeSymbol(symbol, horizon)));
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

function lastRow(rows) {
  return rows && rows.length ? rows[rows.length - 1] : null;
}

function pickIndicatorSeries(rows, keyMap) {
  return (rows || []).map((row) => {
    const mapped = {
      date: row.date
    };
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

async function getStockDetail(symbol) {
  const periods = {
    "1d": { daysBack: 1, timeframe: "D" },
    "3d": { daysBack: 7, timeframe: "D" },
    "5d": { daysBack: 10, timeframe: "D" },
    "1m": { daysBack: 35, timeframe: "D" },
    "3m": { daysBack: 100, timeframe: "D" },
    "6m": { daysBack: 200, timeframe: "D" },
    "1y": { daysBack: 370, timeframe: "D" }
  };

  const stockMeta = getStock(symbol);
  const metrics = await buildMetrics(symbol);
  const [quote, candles, macd, kdj] = await Promise.all([
    fugleClient.getQuote(symbol),
    fugleClient.getHistoricalCandles(symbol, { daysBack: 370 }),
    fugleClient.getMACD(symbol, { daysBack: 200 }),
    fugleClient.getKDJ(symbol, { daysBack: 200 })
  ]);

  const candleRows = candles?.data || [];
  const macdRows = macd?.data || [];
  const kdjRows = kdj?.data || [];
  const latestCandle = lastRow(candleRows);
  const latestMacd = lastRow(macdRows);
  const latestKdj = lastRow(kdjRows);

  const windows = Object.entries(periods).reduce((accumulator, [key, value]) => {
    const subset = tail(candleRows, value.daysBack);
    const macdSubset = tail(macdRows, value.daysBack);
    const kdjSubset = tail(kdjRows, value.daysBack);
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

  return {
    symbol,
    profile: {
      name: stockMeta?.name || quote?.name || symbol,
      market: stockMeta?.market || null,
      industry: stockMeta?.industry || null,
      sectors: getStockSectors(symbol)
    },
    quote: {
      name: stockMeta?.name || quote?.name || symbol,
      closePrice: quote?.closePrice || latestCandle?.close || null,
      openPrice: quote?.openPrice || latestCandle?.open || null,
      highPrice: quote?.highPrice || latestCandle?.high || null,
      lowPrice: quote?.lowPrice || latestCandle?.low || null,
      previousClose: quote?.previousClose || null,
      change: quote?.change || null,
      changePercent: quote?.changePercent || null,
      tradeVolume: quote?.tradeVolume || latestCandle?.volume || null,
      tradeDate: quote?.date || latestCandle?.date || null
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
    horizonScores: {
      short: analyzeByHorizon(metrics, "short"),
      mid: analyzeByHorizon(metrics, "mid"),
      long: analyzeByHorizon(metrics, "long")
    },
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
