const HORIZONS = {
  short: {
    label: "Short",
    note: "Planned model: TCN-Transformer / MASTER for 5 to 20 trading days."
  },
  mid: {
    label: "Mid",
    note: "Planned model: XGBoost / LightGBM for 1 to 3 months."
  },
  long: {
    label: "Long",
    note: "Planned model: Bayesian Neural Networks for 3 to 12 months."
  }
};

const state = {
  sectors: [],
  sector: "ai",
  horizon: "short"
};

const elements = {
  sectorTabs: document.querySelector("#sectorTabs"),
  horizonTabs: document.querySelector("#horizonTabs"),
  stockList: document.querySelector("#stockList"),
  resultTitle: document.querySelector("#resultTitle"),
  generatedAtLabel: document.querySelector("#generatedAtLabel"),
  activeSectorLabel: document.querySelector("#activeSectorLabel"),
  activeHorizonLabel: document.querySelector("#activeHorizonLabel"),
  bullishCount: document.querySelector("#bullishCount"),
  topStockLabel: document.querySelector("#topStockLabel"),
  dataSourceBadge: document.querySelector("#dataSourceBadge"),
  refreshButton: document.querySelector("#refreshButton"),
  algorithmNotes: document.querySelector("#algorithmNotes"),
  template: document.querySelector("#stockCardTemplate"),
  stockSearchForm: document.querySelector("#stockSearchForm"),
  stockSymbolInput: document.querySelector("#stockSymbolInput"),
  detailTitle: document.querySelector("#detailTitle"),
  detailDateLabel: document.querySelector("#detailDateLabel"),
  detailSymbol: document.querySelector("#detailSymbol"),
  detailName: document.querySelector("#detailName"),
  detailClosePrice: document.querySelector("#detailClosePrice"),
  detailChange: document.querySelector("#detailChange"),
  detailProfileBadges: document.querySelector("#detailProfileBadges"),
  detailHorizonScores: document.querySelector("#detailHorizonScores"),
  detailMetrics: document.querySelector("#detailMetrics"),
  indicatorSnapshot: document.querySelector("#indicatorSnapshot"),
  windowTable: document.querySelector("#windowTable"),
  detailBullishReasons: document.querySelector("#detailBullishReasons"),
  detailRiskReasons: document.querySelector("#detailRiskReasons"),
  priceChart: document.querySelector("#priceChart"),
  indicatorChart: document.querySelector("#indicatorChart"),
  detailState: document.querySelector("#detailState")
};

async function fetchJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || `Request failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
}

function stars(count) {
  return String.fromCharCode(9733).repeat(count) + String.fromCharCode(9734).repeat(5 - count);
}

function formatNumber(value) {
  return value === null || value === undefined || Number.isNaN(value)
    ? "-"
    : Number(value).toLocaleString("zh-TW", { maximumFractionDigits: 2 });
}

function setDetailState(message) {
  elements.detailState.textContent = message || "";
}

function renderSectorTabs() {
  elements.sectorTabs.innerHTML = "";
  state.sectors.forEach((sector) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "stack-tab";
    button.innerHTML = `${sector.label}<small>${sector.description}</small>`;
    button.style.borderLeft = `4px solid ${sector.color}`;
    button.classList.toggle("active", sector.id === state.sector);
    button.addEventListener("click", () => {
      state.sector = sector.id;
      loadAnalysis();
    });
    elements.sectorTabs.appendChild(button);
  });
}

function renderHorizonTabs() {
  elements.horizonTabs.innerHTML = "";
  Object.entries(HORIZONS).forEach(([key, value]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "inline-tab";
    button.textContent = value.label;
    button.classList.toggle("active", key === state.horizon);
    button.addEventListener("click", () => {
      state.horizon = key;
      loadAnalysis();
      if (elements.stockSymbolInput.value.trim()) {
        loadStockDetail(elements.stockSymbolInput.value.trim());
      }
    });
    elements.horizonTabs.appendChild(button);
  });
}

function renderNotes() {
  elements.algorithmNotes.innerHTML = "";
  Object.values(HORIZONS).forEach((item) => {
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `<h3>${item.label}</h3><p>${item.note}</p>`;
    elements.algorithmNotes.appendChild(card);
  });
}

function renderSummary(result) {
  const activeSector = state.sectors.find((sector) => sector.id === state.sector);
  const topStock = result.stocks[0];
  const bullishCount = result.stocks.filter((stock) => stock.analysis.score >= 60).length;

  elements.resultTitle.textContent = `${activeSector?.label || "Sector"} ${HORIZONS[state.horizon].label} view`;
  elements.generatedAtLabel.textContent = `Updated ${new Date(result.generatedAt).toLocaleString("zh-TW")}`;
  elements.activeSectorLabel.textContent = activeSector?.label || "-";
  elements.activeHorizonLabel.textContent = HORIZONS[state.horizon].label;
  elements.bullishCount.textContent = `${bullishCount} stocks`;
  elements.topStockLabel.textContent = topStock ? `${topStock.name} ${stars(topStock.analysis.stars)}` : "No data";
  elements.dataSourceBadge.textContent = result.dataSource === "fugle" ? "Live Fugle data" : "Fugle + fallback";
}

function renderStocks(result) {
  elements.stockList.innerHTML = "";

  result.stocks.forEach((stock) => {
    const fragment = elements.template.content.cloneNode(true);
    const card = fragment.querySelector(".stock-card");
    fragment.querySelector(".stock-code").textContent = stock.symbol;
    fragment.querySelector(".stock-name").textContent = stock.name;
    fragment.querySelector(".score-value").textContent = `${stock.analysis.score} pts`;
    fragment.querySelector(".star-rating").textContent = stars(stock.analysis.stars);
    fragment.querySelector(".signal-pill").textContent = stock.analysis.biasLabel;
    fragment.querySelector(".confidence-pill").textContent = `Confidence ${stock.analysis.confidence}%`;

    const bullishList = fragment.querySelector(".bullish-reasons");
    const riskList = fragment.querySelector(".risk-reasons");

    stock.analysis.bullishReasons.forEach((reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      bullishList.appendChild(item);
    });

    stock.analysis.riskReasons.forEach((reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      riskList.appendChild(item);
    });

    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      elements.stockSymbolInput.value = stock.symbol;
      loadStockDetail(stock.symbol);
      document.querySelector(".detail-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    elements.stockList.appendChild(fragment);
  });
}

function polylinePoints(values, width, height, padding) {
  if (!values.length) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, values.length - 1);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
}

function renderPriceChart(detail) {
  const candles = detail.series.candles.slice(-60);
  if (!candles.length) {
    elements.priceChart.innerHTML = "<p>No price series available.</p>";
    return;
  }

  const width = 640;
  const height = 220;
  const padding = 20;
  const closes = candles.map((item) => Number(item.close)).filter(Number.isFinite);
  const volumes = candles.map((item) => Number(item.volume)).filter(Number.isFinite);
  const points = polylinePoints(closes, width, height, padding);
  const volumeMax = Math.max(...volumes, 1);

  const bars = candles.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, candles.length - 1);
    const barWidth = 4;
    const value = Number(item.volume) || 0;
    const barHeight = (value / volumeMax) * 60;
    const y = height - padding - barHeight;
    return `<rect x="${x - barWidth / 2}" y="${y}" width="${barWidth}" height="${barHeight}" fill="rgba(44,105,209,0.18)" rx="2" />`;
  }).join("");

  elements.priceChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Price and volume chart">
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(16,24,40,0.12)" />
      ${bars}
      <polyline fill="none" stroke="#0b6e69" stroke-width="3" points="${points}" />
    </svg>
  `;
}

function renderIndicatorChart(detail) {
  const macdRows = detail.series.macd.slice(-60);
  const kdjRows = detail.series.kdj.slice(-60);
  if (!macdRows.length && !kdjRows.length) {
    elements.indicatorChart.innerHTML = "<p>No indicator series available.</p>";
    return;
  }

  const width = 640;
  const height = 220;
  const padding = 20;
  const macdLine = macdRows.map((item) => Number(item.macdLine)).filter(Number.isFinite);
  const signalLine = macdRows.map((item) => Number(item.signalLine)).filter(Number.isFinite);
  const kLine = kdjRows.map((item) => Number(item.k)).filter(Number.isFinite);
  const dLine = kdjRows.map((item) => Number(item.d)).filter(Number.isFinite);
  const macdPoints = polylinePoints(macdLine, width, height, padding);
  const signalPoints = polylinePoints(signalLine, width, height, padding);
  const kPoints = polylinePoints(kLine, width, height, padding);
  const dPoints = polylinePoints(dLine, width, height, padding);

  elements.indicatorChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="MACD and KDJ chart">
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(16,24,40,0.12)" />
      <polyline fill="none" stroke="#d46a1f" stroke-width="2.5" points="${macdPoints}" />
      <polyline fill="none" stroke="#2c69d1" stroke-width="2.5" points="${signalPoints}" />
      <polyline fill="none" stroke="#0b6e69" stroke-width="2" points="${kPoints}" />
      <polyline fill="none" stroke="#7a445f" stroke-width="2" points="${dPoints}" />
    </svg>
  `;
}

function renderDetail(detail) {
  elements.detailTitle.textContent = `${detail.symbol} stock detail`;
  elements.detailDateLabel.textContent = detail.quote.tradeDate ? `Trade date ${detail.quote.tradeDate}` : "No trade date";
  elements.detailSymbol.textContent = detail.symbol;
  elements.detailName.textContent = detail.quote.name || detail.symbol;
  elements.detailClosePrice.textContent = detail.quote.closePrice ? `${formatNumber(detail.quote.closePrice)}` : "-";

  const change = detail.quote.change;
  const changePercent = detail.quote.changePercent;
  elements.detailChange.textContent = change === null || change === undefined
    ? "-"
    : `${change >= 0 ? "+" : ""}${formatNumber(change)} (${changePercent >= 0 ? "+" : ""}${formatNumber(changePercent)}%)`;

  elements.detailProfileBadges.innerHTML = "";
  [
    detail.profile.market,
    detail.profile.industry,
    ...(detail.profile.sectors || []).map((sector) => sector.label)
  ].filter(Boolean).forEach((label) => {
    const node = document.createElement("span");
    node.className = "detail-badge";
    node.textContent = label;
    elements.detailProfileBadges.appendChild(node);
  });

  elements.detailHorizonScores.innerHTML = "";
  [
    { key: "short", label: "Short" },
    { key: "mid", label: "Mid" },
    { key: "long", label: "Long" }
  ].forEach((item) => {
    const score = detail.horizonScores[item.key];
    const node = document.createElement("article");
    node.className = "horizon-score-card";
    node.innerHTML = `<span>${item.label}</span><strong>${score.score} pts ${stars(score.stars)}</strong><p>${score.biasLabel}</p>`;
    elements.detailHorizonScores.appendChild(node);
  });

  const activeHorizonScore = detail.horizonScores[state.horizon];
  elements.detailBullishReasons.innerHTML = "";
  elements.detailRiskReasons.innerHTML = "";
  activeHorizonScore.bullishReasons.forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    elements.detailBullishReasons.appendChild(item);
  });
  activeHorizonScore.riskReasons.forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    elements.detailRiskReasons.appendChild(item);
  });

  elements.detailMetrics.innerHTML = "";
  [
    { label: "Open", value: detail.quote.openPrice },
    { label: "High", value: detail.quote.highPrice },
    { label: "Low", value: detail.quote.lowPrice },
    { label: "Prev close", value: detail.quote.previousClose },
    { label: "Volume", value: detail.quote.tradeVolume }
  ].forEach((item) => {
    const node = document.createElement("div");
    node.className = "metric-chip";
    node.innerHTML = `<span>${item.label}</span><strong>${formatNumber(item.value)}</strong>`;
    elements.detailMetrics.appendChild(node);
  });

  elements.indicatorSnapshot.innerHTML = "";
  [
    { label: "MACD", value: detail.latestIndicators.macd?.macdLine },
    { label: "Signal", value: detail.latestIndicators.macd?.signalLine },
    { label: "Histogram", value: detail.latestIndicators.macd?.histogram },
    { label: "K", value: detail.latestIndicators.kdj?.k },
    { label: "D", value: detail.latestIndicators.kdj?.d },
    { label: "J", value: detail.latestIndicators.kdj?.j }
  ].forEach((item) => {
    const node = document.createElement("div");
    node.className = "indicator-chip";
    node.innerHTML = `<span>${item.label}</span><strong>${formatNumber(item.value)}</strong>`;
    elements.indicatorSnapshot.appendChild(node);
  });

  elements.windowTable.innerHTML = "";
  const labels = {
    "1d": "1D",
    "3d": "3D",
    "5d": "5D",
    "1m": "1M",
    "3m": "3M",
    "6m": "6M",
    "1y": "1Y"
  };

  Object.entries(labels).forEach(([key, label]) => {
    const row = detail.windows[key] || {};
    const node = document.createElement("div");
    node.className = "window-row";
    node.innerHTML = `
      <div><span>Window</span><strong>${label}</strong></div>
      <div><span>Close</span><strong>${formatNumber(row.close)}</strong></div>
      <div><span>MACD</span><strong>${formatNumber(row.macdLine)}</strong></div>
      <div><span>K / D</span><strong>${formatNumber(row.k)} / ${formatNumber(row.d)}</strong></div>
      <div><span>Volume</span><strong>${formatNumber(row.volume)}</strong></div>
    `;
    elements.windowTable.appendChild(node);
  });

  renderPriceChart(detail);
  renderIndicatorChart(detail);
  setDetailState(`Universe source: ${detail.profile.universeSource}`);
}

function renderDetailError(message) {
  elements.detailTitle.textContent = "Stock detail unavailable";
  elements.detailDateLabel.textContent = "Error";
  elements.detailSymbol.textContent = "-";
  elements.detailName.textContent = message;
  elements.detailClosePrice.textContent = "-";
  elements.detailChange.textContent = "-";
  elements.detailProfileBadges.innerHTML = "";
  elements.detailHorizonScores.innerHTML = "";
  elements.detailMetrics.innerHTML = "";
  elements.indicatorSnapshot.innerHTML = "";
  elements.windowTable.innerHTML = "";
  elements.detailBullishReasons.innerHTML = "";
  elements.detailRiskReasons.innerHTML = "";
  elements.priceChart.innerHTML = "<p>No chart data.</p>";
  elements.indicatorChart.innerHTML = "<p>No chart data.</p>";
  setDetailState(message);
}

function renderDetailLoading(symbol) {
  elements.detailTitle.textContent = `Loading ${symbol}`;
  setDetailState("Fetching quote, indicators, and chart data...");
}

async function loadSectors() {
  const result = await fetchJson("/api/sectors");
  state.sectors = result.sectors;
  renderSectorTabs();
  renderHorizonTabs();
  renderNotes();
}

async function loadAnalysis() {
  renderSectorTabs();
  renderHorizonTabs();
  elements.generatedAtLabel.textContent = "Loading";

  const result = await fetchJson(`/api/analysis?sector=${state.sector}&horizon=${state.horizon}`);
  renderSummary(result);
  renderStocks(result);
}

async function loadStockDetail(symbol) {
  renderDetailLoading(symbol);
  try {
    const detail = await fetchJson(`/api/stock/${symbol}`);
    renderDetail(detail);
  } catch (error) {
    renderDetailError(error.message);
  }
}

elements.refreshButton.addEventListener("click", () => {
  loadAnalysis();
  if (elements.stockSymbolInput.value.trim()) {
    loadStockDetail(elements.stockSymbolInput.value.trim());
  }
});

elements.stockSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const symbol = elements.stockSymbolInput.value.trim();
  if (!symbol) {
    renderDetailError("Please enter a 4-digit stock symbol.");
    return;
  }
  await loadStockDetail(symbol);
});

async function bootstrap() {
  await loadSectors();
  await loadAnalysis();
  elements.stockSymbolInput.value = "2330";
  await loadStockDetail("2330");
}

bootstrap().catch((error) => {
  elements.stockList.innerHTML = `<article class="note-card"><h3>Load failed</h3><p>${error.message}</p></article>`;
  elements.dataSourceBadge.textContent = "Load failed";
});
