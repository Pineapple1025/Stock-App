const {
  SECTORS,
  STOCKS: FALLBACK_STOCKS,
  INDUSTRY_SECTOR_RULES,
  SECTOR_MEMBERSHIPS: FALLBACK_MEMBERSHIPS,
  getStockSectors: getFallbackStockSectors
} = require("../data/sectors");
const fetchClient = require("../utils/fetchClient");

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const REVENUE_API = "https://openapi.twse.com.tw/v1/opendata/t187ap05_P";
const LISTED_BASIC_API = "https://openapi.twse.com.tw/v1/opendata/t187ap03_L";

const cache = {
  expiresAt: 0,
  value: null
};

function normalizeSymbol(value) {
  const text = String(value || "").trim();
  return /^\d{4}$/.test(text) ? text : "";
}

function buildFallbackUniverse() {
  return {
    stocks: FALLBACK_STOCKS,
    sectorMemberships: FALLBACK_MEMBERSHIPS,
    source: "fallback",
    generatedAt: new Date().toISOString()
  };
}

function createEmptyMemberships() {
  return SECTORS.reduce((accumulator, sector) => {
    accumulator[sector.id] = [];
    return accumulator;
  }, {});
}

function pushMembership(sectorMemberships, sectorId, symbol) {
  if (!sectorMemberships[sectorId]) {
    sectorMemberships[sectorId] = [];
  }
  if (!sectorMemberships[sectorId].includes(symbol)) {
    sectorMemberships[sectorId].push(symbol);
  }
}

function buildIndustryMemberships(stocks) {
  const memberships = createEmptyMemberships();

  Object.values(stocks).forEach((stock) => {
    const industry = stock.industry || "";
    Object.entries(INDUSTRY_SECTOR_RULES).forEach(([sectorId, keywords]) => {
      if (keywords.some((keyword) => industry.includes(keyword))) {
        pushMembership(memberships, sectorId, stock.symbol);
      }
    });
  });

  Object.entries(FALLBACK_MEMBERSHIPS).forEach(([sectorId, symbols]) => {
    symbols.forEach((symbol) => {
      if (stocks[symbol]) {
        pushMembership(memberships, sectorId, symbol);
      }
    });
  });

  return memberships;
}

async function fetchJson(url) {
  const response = await fetchClient(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Universe fetch failed: ${response.status}`);
  }

  return response.json();
}

async function buildOfficialUniverse() {
  const [revenueRows, listedRows] = await Promise.all([
    fetchJson(REVENUE_API),
    fetchJson(LISTED_BASIC_API)
  ]);

  function parseRevenueRow(row) {
    const values = Object.values(row || {});
    return {
      symbol: normalizeSymbol(values[2]),
      name: values[3],
      industry: values[4]
    };
  }

  function parseListedRow(row) {
    const values = Object.values(row || {});
    return {
      symbol: normalizeSymbol(values[1]),
      name: values[2],
      shortName: values[3],
      industryCode: values[5]
    };
  }

  const listedMap = new Map(
    (listedRows || [])
      .map((row) => {
        const parsed = parseListedRow(row);
        return parsed.symbol ? [parsed.symbol, parsed] : null;
      })
      .filter(Boolean)
  );

  const stocks = {};

  (revenueRows || []).forEach((row) => {
    const revenue = parseRevenueRow(row);
    const symbol = revenue.symbol;
    if (!symbol) {
      return;
    }

    const listedRow = listedMap.get(symbol);
    stocks[symbol] = {
      symbol,
      name: revenue.name || listedRow?.shortName || listedRow?.name || symbol,
      market: listedRow ? "TWSE" : "PUBLIC",
      industry: revenue.industry || listedRow?.industryCode || "Unknown",
      active: true,
      source: listedRow ? "twse-openapi" : "public-company-openapi"
    };
  });

  Object.entries(FALLBACK_STOCKS).forEach(([symbol, stock]) => {
    stocks[symbol] = {
      ...stock,
      ...(stocks[symbol] || {}),
      symbol
    };
  });

  return {
    stocks,
    sectorMemberships: buildIndustryMemberships(stocks),
    source: "official+fallback",
    generatedAt: new Date().toISOString()
  };
}

async function getUniverse(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache.value && cache.expiresAt > now) {
    return cache.value;
  }

  try {
    cache.value = await buildOfficialUniverse();
  } catch (_error) {
    cache.value = buildFallbackUniverse();
  }

  cache.expiresAt = now + CACHE_TTL_MS;
  return cache.value;
}

async function getSectorsWithCounts() {
  const universe = await getUniverse();
  return SECTORS.map((sector) => ({
    ...sector,
    totalSymbols: (universe.sectorMemberships[sector.id] || []).length
  }));
}

async function getSectorSymbols(sectorId) {
  const universe = await getUniverse();
  return universe.sectorMemberships[sectorId] || [];
}

async function getStock(symbol) {
  const universe = await getUniverse();
  return universe.stocks[symbol] || null;
}

async function getStockSectors(symbol) {
  const universe = await getUniverse();
  return SECTORS.filter((sector) => (universe.sectorMemberships[sector.id] || []).includes(symbol)).map((sector) => ({
    id: sector.id,
    label: sector.label,
    color: sector.color
  }));
}

function getFallbackStockSectorsSafe(symbol) {
  return getFallbackStockSectors(symbol);
}

module.exports = {
  getUniverse,
  getSectorsWithCounts,
  getSectorSymbols,
  getStock,
  getStockSectors,
  getFallbackStockSectorsSafe
};
