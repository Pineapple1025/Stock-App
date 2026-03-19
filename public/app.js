const HORIZONS = {
  short: {
    label: "短期",
    note: "短期模型規劃採用 TCN-Transformer，並保留 MASTER 架構作為後續升級方向，主要觀察 5 到 20 個交易日。"
  },
  mid: {
    label: "中期",
    note: "中期模型規劃採用 XGBoost / LightGBM，重點放在 1 到 3 個月的趨勢延續與基本面變化。"
  },
  long: {
    label: "長期",
    note: "長期模型規劃採用 Bayesian Neural Networks，評估 3 到 12 個月的趨勢、成長與估值。"
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
    const message = body.message || `請求失敗，狀態碼 ${response.status}`;
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

function appendListItems(container, items, fallbackText) {
  container.innerHTML = "";
  if (!items.length) {
    const item = document.createElement("li");
    item.textContent = fallbackText;
    container.appendChild(item);
    return;
  }

  items.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    container.appendChild(item);
  });
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

  elements.resultTitle.textContent = `${activeSector?.label || "分類"} ${HORIZONS[state.horizon].label}分析`;
  elements.generatedAtLabel.textContent = `更新時間 ${new Date(result.generatedAt).toLocaleString("zh-TW")}`;
  elements.activeSectorLabel.textContent = activeSector?.label || "-";
  elements.activeHorizonLabel.textContent = HORIZONS[state.horizon].label;
  elements.bullishCount.textContent = `${bullishCount} 檔`;
  elements.topStockLabel.textContent = topStock ? `${topStock.name} ${stars(topStock.analysis.stars)}` : "尚無資料";
  elements.dataSourceBadge.textContent = result.dataSource === "fugle" ? "Fugle 即時資料" : "Fugle + 備援資料";
}

function renderStocks(result) {
  elements.stockList.innerHTML = "";

  if (!result.stocks.length) {
    elements.stockList.innerHTML = '<article class="note-card"><h3>目前沒有資料</h3><p>這個分類暫時沒有可分析的股票，請稍後再試。</p></article>';
    return;
  }

  result.stocks.forEach((stock) => {
    const fragment = elements.template.content.cloneNode(true);
    const card = fragment.querySelector(".stock-card");
    fragment.querySelector(".stock-code").textContent = stock.symbol;
    fragment.querySelector(".stock-name").textContent = stock.name;
    fragment.querySelector(".score-value").textContent = `${stock.analysis.score} 分`;
    fragment.querySelector(".star-rating").textContent = stars(stock.analysis.stars);
    fragment.querySelector(".signal-pill").textContent = stock.analysis.biasLabel;
    fragment.querySelector(".confidence-pill").textContent = `信心度 ${stock.analysis.confidence}%`;

    appendListItems(fragment.querySelector(".bullish-reasons"), stock.analysis.bullishReasons, "目前沒有明確看漲因素。");
    appendListItems(fragment.querySelector(".risk-reasons"), stock.analysis.riskReasons, "目前沒有顯著風險提醒。");

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
    elements.priceChart.innerHTML = "<p>目前沒有足夠的價格資料。</p>";
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
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="股價與成交量圖">
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
    elements.indicatorChart.innerHTML = "<p>目前沒有足夠的技術指標資料。</p>";
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
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="MACD 與 KDJ 圖">
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(16,24,40,0.12)" />
      <polyline fill="none" stroke="#d46a1f" stroke-width="2.5" points="${macdPoints}" />
      <polyline fill="none" stroke="#2c69d1" stroke-width="2.5" points="${signalPoints}" />
      <polyline fill="none" stroke="#0b6e69" stroke-width="2" points="${kPoints}" />
      <polyline fill="none" stroke="#7a445f" stroke-width="2" points="${dPoints}" />
    </svg>
  `;
}

function renderDetail(detail) {
  elements.detailTitle.textContent = `${detail.symbol} 單股分析`;
  elements.detailDateLabel.textContent = detail.quote.tradeDate ? `資料日期 ${detail.quote.tradeDate}` : "目前無最新日期";
  elements.detailSymbol.textContent = detail.symbol;
  elements.detailName.textContent = detail.quote.name || detail.symbol;
  elements.detailClosePrice.textContent = detail.quote.closePrice ? formatNumber(detail.quote.closePrice) : "-";

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
    { key: "short", label: "短期" },
    { key: "mid", label: "中期" },
    { key: "long", label: "長期" }
  ].forEach((item) => {
    const score = detail.horizonScores[item.key];
    const node = document.createElement("article");
    node.className = "horizon-score-card";
    node.innerHTML = `<span>${item.label}</span><strong>${score.score} 分 ${stars(score.stars)}</strong><p>${score.biasLabel}</p>`;
    elements.detailHorizonScores.appendChild(node);
  });

  const activeHorizonScore = detail.horizonScores[state.horizon];
  appendListItems(elements.detailBullishReasons, activeHorizonScore.bullishReasons, "目前沒有明確看漲因素。");
  appendListItems(elements.detailRiskReasons, activeHorizonScore.riskReasons, "目前沒有顯著風險提醒。");

  elements.detailMetrics.innerHTML = "";
  [
    { label: "開盤", value: detail.quote.openPrice },
    { label: "最高", value: detail.quote.highPrice },
    { label: "最低", value: detail.quote.lowPrice },
    { label: "昨收", value: detail.quote.previousClose },
    { label: "成交量", value: detail.quote.tradeVolume }
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
    { label: "柱狀體", value: detail.latestIndicators.macd?.histogram },
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
    "1d": "當日",
    "3d": "三日",
    "5d": "五日",
    "1m": "近月",
    "3m": "三月",
    "6m": "六月",
    "1y": "一年"
  };

  Object.entries(labels).forEach(([key, label]) => {
    const row = detail.windows[key] || {};
    const node = document.createElement("div");
    node.className = "window-row";
    node.innerHTML = `
      <div><span>期間</span><strong>${label}</strong></div>
      <div><span>收盤</span><strong>${formatNumber(row.close)}</strong></div>
      <div><span>MACD</span><strong>${formatNumber(row.macdLine)}</strong></div>
      <div><span>K / D</span><strong>${formatNumber(row.k)} / ${formatNumber(row.d)}</strong></div>
      <div><span>成交量</span><strong>${formatNumber(row.volume)}</strong></div>
    `;
    elements.windowTable.appendChild(node);
  });

  renderPriceChart(detail);
  renderIndicatorChart(detail);
  setDetailState(`單股資料來源 ${detail.profile.universeSource}`);
}

function renderDetailError(message) {
  elements.detailTitle.textContent = "查詢失敗";
  elements.detailDateLabel.textContent = "請重新查詢";
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
  elements.priceChart.innerHTML = "<p>目前沒有圖表資料。</p>";
  elements.indicatorChart.innerHTML = "<p>目前沒有圖表資料。</p>";
  setDetailState(message);
}

function renderDetailLoading(symbol) {
  elements.detailTitle.textContent = `正在載入 ${symbol}`;
  setDetailState("正在取得單股資料與技術指標...");
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
  elements.generatedAtLabel.textContent = "載入中";
  try {
    const result = await fetchJson(`/api/analysis?sector=${state.sector}&horizon=${state.horizon}`);
    renderSummary(result);
    renderStocks(result);
  } catch (error) {
    elements.stockList.innerHTML = `<article class="note-card"><h3>載入失敗</h3><p>${error.message}</p></article>`;
    elements.generatedAtLabel.textContent = "載入失敗";
    elements.dataSourceBadge.textContent = "資料載入失敗";
  }
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
    renderDetailError("請輸入 4 位股票代碼。");
    return;
  }
  await loadStockDetail(symbol);
});

async function bootstrap() {
  await loadSectors();
  await loadAnalysis();
  elements.stockSymbolInput.value = "2330";
  loadStockDetail("2330");
}

bootstrap().catch((error) => {
  elements.stockList.innerHTML = `<article class="note-card"><h3>載入失敗</h3><p>${error.message}</p></article>`;
  elements.dataSourceBadge.textContent = "資料載入失敗";
});
