const { fugleApiKey, fugleBaseUrl } = require("../config");

function buildUrl(path, query = {}) {
  const url = new URL(`${fugleBaseUrl}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

async function request(path, query) {
  if (!fugleApiKey) {
    return null;
  }

  const response = await fetch(buildUrl(path, query), {
    headers: {
      "X-API-KEY": fugleApiKey
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Fugle API error ${response.status}`);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }

  return response.json();
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(daysBack) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - daysBack);
  return {
    from: formatDate(from),
    to: formatDate(to)
  };
}

async function getQuote(symbol) {
  return request(`/intraday/quote/${symbol}`);
}

async function getHistoricalCandles(symbol, options = {}) {
  const range = buildDateRange(options.daysBack || 220);
  return request(`/historical/candles/${symbol}`, {
    ...range,
    timeframe: options.timeframe || "D",
    fields: "open,high,low,close,volume,change",
    sort: "asc",
    adjusted: "true"
  });
}

async function getSMA(symbol, period, options = {}) {
  const range = buildDateRange(options.daysBack || 260);
  return request(`/technical/sma/${symbol}`, {
    ...range,
    timeframe: options.timeframe || "D",
    period
  });
}

async function getRSI(symbol, period = 14, options = {}) {
  const range = buildDateRange(options.daysBack || 90);
  return request(`/technical/rsi/${symbol}`, {
    ...range,
    timeframe: options.timeframe || "D",
    period
  });
}

async function getMACD(symbol, options = {}) {
  const range = buildDateRange(options.daysBack || 120);
  return request(`/technical/macd/${symbol}`, {
    ...range,
    timeframe: options.timeframe || "D",
    fast: options.fast || 12,
    slow: options.slow || 26,
    signal: options.signal || 9
  });
}

async function getKDJ(symbol, options = {}) {
  const range = buildDateRange(options.daysBack || 120);
  return request(`/technical/kdj/${symbol}`, {
    ...range,
    timeframe: options.timeframe || "D",
    rPeriod: options.rPeriod || 9,
    kPeriod: options.kPeriod || 3,
    dPeriod: options.dPeriod || 3
  });
}

module.exports = {
  getQuote,
  getHistoricalCandles,
  getSMA,
  getRSI,
  getMACD,
  getKDJ
};
