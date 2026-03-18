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
  detailRiskReasons: document.querySelector("#detailRiskReasons")
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function stars(count) {
  return "★".repeat(count) + "☆".repeat(5 - count);
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
    });

    elements.stockList.appendChild(fragment);
  });
}

function formatNumber(value) {
  return value === null || value === undefined || Number.isNaN(value)
    ? "-"
    : Number(value).toLocaleString("zh-TW", { maximumFractionDigits: 2 });
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
  const detail = await fetchJson(`/api/stock/${symbol}`);
  renderDetail(detail);
}

elements.refreshButton.addEventListener("click", loadAnalysis);

elements.stockSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const symbol = elements.stockSymbolInput.value.trim();
  if (!symbol) {
    return;
  }
  elements.detailTitle.textContent = `Loading ${symbol}`;
  await loadStockDetail(symbol);
});

async function bootstrap() {
  await loadSectors();
  await loadAnalysis();
  await loadStockDetail("2330");
}

bootstrap().catch((error) => {
  elements.stockList.innerHTML = `<article class="note-card"><h3>Load failed</h3><p>${error.message}</p></article>`;
  elements.dataSourceBadge.textContent = "Load failed";
});
