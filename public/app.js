const BUILD_VERSION = "20260319-indicators-1";
const WATCHLIST_STORAGE_KEY = "stock-app-watchlists-v1";

const HORIZONS = {
  short: { label: "短期" },
  mid: { label: "中期" },
  long: { label: "長期" }
};

const RANGE_OPTIONS = [
  { key: "1d", label: "當日", count: 1, chartCount: 20 },
  { key: "3d", label: "三日", count: 3 },
  { key: "5d", label: "五日", count: 5 },
  { key: "1m", label: "近月", count: 22 },
  { key: "3m", label: "三月", count: 66 },
  { key: "6m", label: "六月", count: 132 },
  { key: "1y", label: "一年", count: 264 }
];

const DEFAULT_WATCHLISTS = [
  { id: "default-1", name: "自選1", stocks: [] },
  { id: "default-2", name: "自選2", stocks: [] },
  { id: "default-3", name: "自選3", stocks: [] }
];

const state = {
  sectors: [],
  sector: "ai",
  horizon: "short",
  view: "home",
  selectedSymbol: "",
  detailRange: "1m",
  detail: null,
  watchlists: [],
  activeWatchlistId: DEFAULT_WATCHLISTS[0].id,
  searchSuggestions: [],
  searchActiveIndex: -1,
  searchSelectedSymbol: "",
  searchDebounceId: null,
  detailAutoRefreshId: null
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
  watchlistManagerButton: document.querySelector("#watchlistManagerButton"),
  watchlistQuickOpenButton: document.querySelector("#watchlistQuickOpenButton"),
  activeWatchlistName: document.querySelector("#activeWatchlistName"),
  watchlistPreview: document.querySelector("#watchlistPreview"),
  template: document.querySelector("#stockCardTemplate"),
  stockSearchForm: document.querySelector("#stockSearchForm"),
  stockSymbolInput: document.querySelector("#stockSymbolInput"),
  searchSuggestions: document.querySelector("#searchSuggestions"),
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
  indicatorSnapshotDetail: document.querySelector("#indicatorSnapshotDetail"),
  detailBullishReasons: document.querySelector("#detailBullishReasons"),
  detailRiskReasons: document.querySelector("#detailRiskReasons"),
  priceChart: document.querySelector("#priceChart"),
  indicatorChart: document.querySelector("#indicatorChart"),
  kdChart: document.querySelector("#kdChart"),
  detailState: document.querySelector("#detailState"),
  backToHomeButton: document.querySelector("#backToHomeButton"),
  detailCard: document.querySelector("#detailCard"),
  detailRangeTabs: document.querySelector("#detailRangeTabs"),
  detailFavoriteButton: document.querySelector("#detailFavoriteButton"),
  watchlistDrawer: document.querySelector("#watchlistDrawer"),
  closeWatchlistDrawerButton: document.querySelector("#closeWatchlistDrawerButton"),
  watchlistTabs: document.querySelector("#watchlistTabs"),
  watchlistItems: document.querySelector("#watchlistItems"),
  watchlistDrawerTitle: document.querySelector("#watchlistDrawerTitle"),
  watchlistDrawerMeta: document.querySelector("#watchlistDrawerMeta"),
  watchlistManagerState: document.querySelector("#watchlistManagerState"),
  addWatchlistButton: document.querySelector("#addWatchlistButton"),
  renameWatchlistButton: document.querySelector("#renameWatchlistButton"),
  deleteWatchlistButton: document.querySelector("#deleteWatchlistButton")
};

function makeId() {
  return `list-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function formatNumber(value, digits = 2) {
  return value === null || value === undefined || Number.isNaN(Number(value))
    ? "-"
    : Number(value).toLocaleString("zh-TW", { maximumFractionDigits: digits });
}

function stars(count) {
  return String.fromCharCode(9733).repeat(count) + String.fromCharCode(9734).repeat(5 - count);
}

function average(values) {
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

async function fetchJson(url) {
  const requestUrl = url.includes("?") ? `${url}&_ts=${Date.now()}` : `${url}?_ts=${Date.now()}`;
  const response = await fetch(requestUrl, { cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `資料載入失敗，狀態碼 ${response.status}`);
  }
  return body;
}

function setDetailState(message) {
  elements.detailState.textContent = message || "";
}

function syncHistory(symbol) {
  const url = new URL(window.location.href);
  if (symbol) {
    url.searchParams.set("stock", symbol);
  } else {
    url.searchParams.delete("stock");
  }
  window.history.pushState({ stock: symbol || null }, "", url);
}

function setViewMode(view, options = {}) {
  state.view = view;
  document.body.classList.toggle("single-stock-mode", view === "detail");
  document.body.classList.toggle("home-mode", view !== "detail");
  elements.backToHomeButton.hidden = view !== "detail";
  syncDetailAutoRefresh();
  if (view === "detail" && options.scroll !== false) {
    elements.detailCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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

function clearSearchSuggestions(options = {}) {
  state.searchSuggestions = [];
  state.searchActiveIndex = -1;
  if (!options.preserveSelection) {
    state.searchSelectedSymbol = "";
  }
  elements.searchSuggestions.hidden = true;
  elements.searchSuggestions.innerHTML = "";
}

function applySearchSuggestion(item) {
  elements.stockSymbolInput.value = item.name;
  state.searchSelectedSymbol = item.symbol;
  clearSearchSuggestions({ preserveSelection: true });
}

function renderSearchSuggestions(items) {
  state.searchSuggestions = items;
  if (!items.length) {
    state.searchActiveIndex = -1;
  } else if (state.searchActiveIndex < 0) {
    state.searchActiveIndex = 0;
  } else if (state.searchActiveIndex >= items.length) {
    state.searchActiveIndex = items.length - 1;
  }
  elements.searchSuggestions.hidden = items.length === 0;

  if (!items.length) {
    elements.searchSuggestions.innerHTML = "";
    return;
  }

  elements.searchSuggestions.innerHTML = items.map((item, index) => {
    const favorite = isStockInActiveWatchlist(item.symbol);
    const sectors = Array.isArray(item.sectors) ? item.sectors.map((sector) => sector.label).join(" / ") : "";
    return `
      <button class="search-suggestion-item${index === state.searchActiveIndex ? " is-active" : ""}" type="button" data-suggestion-index="${index}">
        <div class="search-suggestion-main">
          <div>
            <div class="search-suggestion-title">
              <span class="search-suggestion-symbol">${escapeHtml(item.symbol)}</span>
              <span class="search-suggestion-name">${escapeHtml(item.name)}</span>
            </div>
            <div class="search-suggestion-meta">
              <span class="search-suggestion-stars">${stars(item.stars)}</span>
              <span>${escapeHtml(item.biasLabel || "")}</span>
              ${item.industry ? `<span>${escapeHtml(item.industry)}</span>` : ""}
              ${sectors ? `<span>${escapeHtml(sectors)}</span>` : ""}
            </div>
          </div>
          <div class="search-suggestion-badges">
            <span class="search-mini-badge">${formatNumber(item.score, 0)} 分</span>
            ${favorite ? '<span class="search-mini-badge is-favorite">已收藏</span>' : ""}
          </div>
        </div>
      </button>
    `;
  }).join("");
}

async function loadSearchSuggestions(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) {
    clearSearchSuggestions();
    return;
  }

  try {
    const result = await fetchJson(`/api/search?q=${encodeURIComponent(trimmed)}&horizon=${state.horizon}&limit=8`);
    renderSearchSuggestions(result.items || []);
  } catch {
    clearSearchSuggestions();
  }
}

function loadWatchlists() {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) {
      state.watchlists = DEFAULT_WATCHLISTS.map((item) => ({ ...item }));
      return;
    }
    const parsed = JSON.parse(raw);
    state.watchlists = Array.isArray(parsed.watchlists) && parsed.watchlists.length
      ? parsed.watchlists.map((watchlist) => ({
          id: watchlist.id || makeId(),
          name: watchlist.name || "未命名組合",
          stocks: Array.isArray(watchlist.stocks) ? watchlist.stocks : []
        }))
      : DEFAULT_WATCHLISTS.map((item) => ({ ...item }));
    state.activeWatchlistId = parsed.activeWatchlistId || state.watchlists[0].id;
  } catch {
    state.watchlists = DEFAULT_WATCHLISTS.map((item) => ({ ...item }));
    state.activeWatchlistId = DEFAULT_WATCHLISTS[0].id;
  }
}

function saveWatchlists() {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify({
    activeWatchlistId: state.activeWatchlistId,
    watchlists: state.watchlists
  }));
}

function getActiveWatchlist() {
  return state.watchlists.find((watchlist) => watchlist.id === state.activeWatchlistId) || state.watchlists[0];
}

function isStockInActiveWatchlist(symbol) {
  return getActiveWatchlist()?.stocks.some((stock) => stock.symbol === symbol);
}

function updateFavoriteButton(button, symbol) {
  const active = isStockInActiveWatchlist(symbol);
  button.classList.toggle("is-active", active);
  button.textContent = active ? "♥" : "♡";
  button.setAttribute("aria-pressed", String(active));
}

function persistAndRenderWatchlists() {
  saveWatchlists();
  renderWatchlistPreview();
  renderWatchlistDrawer();
  syncFavoriteButtons();
}

function addStockToActiveWatchlist(stock) {
  const active = getActiveWatchlist();
  if (!active) {
    return;
  }
  const exists = active.stocks.some((item) => item.symbol === stock.symbol);
  if (exists) {
    active.stocks = active.stocks.filter((item) => item.symbol !== stock.symbol);
    elements.watchlistManagerState.textContent = `${stock.symbol} 已從「${active.name}」移除。`;
  } else {
    active.stocks.unshift({ symbol: stock.symbol, name: stock.name || stock.symbol });
    elements.watchlistManagerState.textContent = `${stock.symbol} 已加入「${active.name}」。`;
  }
  persistAndRenderWatchlists();
}

function createWatchlist(name) {
  state.watchlists.push({ id: makeId(), name, stocks: [] });
  state.activeWatchlistId = state.watchlists.at(-1).id;
  persistAndRenderWatchlists();
}

function renameActiveWatchlist(name) {
  const active = getActiveWatchlist();
  if (!active) {
    return;
  }
  active.name = name;
  persistAndRenderWatchlists();
}

function deleteActiveWatchlist() {
  if (state.watchlists.length <= 1) {
    elements.watchlistManagerState.textContent = "至少要保留一個自選組合。";
    return;
  }
  const index = state.watchlists.findIndex((watchlist) => watchlist.id === state.activeWatchlistId);
  const removed = state.watchlists[index];
  state.watchlists.splice(index, 1);
  state.activeWatchlistId = state.watchlists[Math.max(0, index - 1)].id;
  elements.watchlistManagerState.textContent = `已刪除「${removed.name}」。`;
  persistAndRenderWatchlists();
}

function openWatchlistDrawer() {
  elements.watchlistDrawer.hidden = false;
  document.body.classList.add("watchlist-open");
  renderWatchlistDrawer();
}

function closeWatchlistDrawer() {
  elements.watchlistDrawer.hidden = true;
  document.body.classList.remove("watchlist-open");
}

function renderWatchlistPreview() {
  const active = getActiveWatchlist();
  elements.activeWatchlistName.textContent = active?.name || "我的自選";
  if (!active || !active.stocks.length) {
    elements.watchlistPreview.innerHTML = '<p class="muted">還沒有收藏股票，點卡片右上角愛心就能加入目前自選。</p>';
    return;
  }
  elements.watchlistPreview.innerHTML = active.stocks.slice(0, 5).map((stock) => `
    <button class="watchlist-preview-item" type="button" data-symbol="${stock.symbol}">
      <strong>${stock.symbol}</strong>
      <span>${stock.name}</span>
    </button>
  `).join("");
  elements.watchlistPreview.querySelectorAll("[data-symbol]").forEach((button) => {
    button.addEventListener("click", () => {
      const { symbol } = button.dataset;
      elements.stockSymbolInput.value = symbol;
      loadStockDetail(symbol, { focus: true, pushHistory: true });
    });
  });
}

function renderWatchlistDrawer() {
  const active = getActiveWatchlist();
  elements.watchlistTabs.innerHTML = "";
  state.watchlists.forEach((watchlist) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "watchlist-tab";
    button.textContent = watchlist.name;
    button.classList.toggle("active", watchlist.id === state.activeWatchlistId);
    button.addEventListener("click", () => {
      state.activeWatchlistId = watchlist.id;
      persistAndRenderWatchlists();
    });
    elements.watchlistTabs.appendChild(button);
  });

  elements.watchlistDrawerTitle.textContent = active?.name || "我的自選";
  elements.watchlistDrawerMeta.textContent = `${active?.stocks.length || 0} 檔股票`;
  elements.deleteWatchlistButton.disabled = state.watchlists.length <= 1;

  if (!active || !active.stocks.length) {
    elements.watchlistItems.innerHTML = '<div class="note-card"><h3>目前沒有收藏</h3><p>從產業排行或單股頁點愛心，就能把股票加入目前自選組合。</p></div>';
    return;
  }

  elements.watchlistItems.innerHTML = active.stocks.map((stock) => `
    <article class="watchlist-item">
      <button class="watchlist-item-main" type="button" data-open-symbol="${stock.symbol}">
        <strong>${stock.symbol}</strong>
        <span>${stock.name}</span>
      </button>
      <button class="favorite-button is-active" type="button" data-remove-symbol="${stock.symbol}" aria-label="移除此股票">♥</button>
    </article>
  `).join("");

  elements.watchlistItems.querySelectorAll("[data-open-symbol]").forEach((button) => {
    button.addEventListener("click", () => {
      const { openSymbol } = button.dataset;
      closeWatchlistDrawer();
      elements.stockSymbolInput.value = openSymbol;
      loadStockDetail(openSymbol, { focus: true, pushHistory: true });
    });
  });

  elements.watchlistItems.querySelectorAll("[data-remove-symbol]").forEach((button) => {
    button.addEventListener("click", () => {
      addStockToActiveWatchlist({ symbol: button.dataset.removeSymbol });
    });
  });
}

function syncFavoriteButtons() {
  document.querySelectorAll("[data-favorite-symbol]").forEach((button) => {
    updateFavoriteButton(button, button.dataset.favoriteSymbol);
  });
  if (state.selectedSymbol) {
    updateFavoriteButton(elements.detailFavoriteButton, state.selectedSymbol);
  } else {
    elements.detailFavoriteButton.classList.remove("is-active");
    elements.detailFavoriteButton.textContent = "♡";
  }
  if (state.searchSuggestions.length) {
    renderSearchSuggestions(state.searchSuggestions);
  }
}

function bindFavoriteButton(button, stock) {
  button.dataset.favoriteSymbol = stock.symbol;
  updateFavoriteButton(button, stock.symbol);
  button.onclick = (event) => {
    event.stopPropagation();
    addStockToActiveWatchlist(stock);
  };
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
      if (state.detail) {
        renderDetail(state.detail);
      }
    });
    elements.horizonTabs.appendChild(button);
  });
}

function renderSummary(result) {
  const activeSector = state.sectors.find((sector) => sector.id === state.sector);
  const topStock = result.stocks[0];
  const bullishCount = result.stocks.filter((stock) => stock.analysis.score >= 60).length;
  elements.resultTitle.textContent = `${activeSector?.label || "產業"} ${HORIZONS[state.horizon].label}分析`;
  elements.generatedAtLabel.textContent = `更新時間 ${new Date(result.generatedAt).toLocaleString("zh-TW")}`;
  elements.activeSectorLabel.textContent = activeSector?.label || "-";
  elements.activeHorizonLabel.textContent = HORIZONS[state.horizon].label;
  elements.bullishCount.textContent = `${bullishCount} 檔`;
  elements.topStockLabel.textContent = topStock ? `${topStock.name} ${stars(topStock.analysis.stars)}` : "暫無資料";
  elements.dataSourceBadge.textContent = result.dataSource === "fugle" ? "Fugle 即時資料" : "Fugle + 備援資料";
}

function renderStocks(result) {
  elements.stockList.innerHTML = "";
  if (!result.stocks.length) {
    elements.stockList.innerHTML = '<article class="note-card"><h3>目前沒有資料</h3><p>請稍後再試，或切換其他產業與週期。</p></article>';
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
    fragment.querySelector(".confidence-pill").textContent = `信心 ${stock.analysis.confidence}%`;
    appendListItems(fragment.querySelector(".bullish-reasons"), stock.analysis.bullishReasons, "目前沒有明確看漲因素。");
    appendListItems(fragment.querySelector(".risk-reasons"), stock.analysis.riskReasons, "目前沒有明確風險提醒。");
    bindFavoriteButton(fragment.querySelector(".card-favorite-button"), { symbol: stock.symbol, name: stock.name });
    card.addEventListener("click", () => {
      elements.stockSymbolInput.value = stock.symbol;
      loadStockDetail(stock.symbol, { focus: true, pushHistory: true });
    });
    elements.stockList.appendChild(fragment);
  });
}

function getRangeOption(key) {
  return RANGE_OPTIONS.find((item) => item.key === key) || RANGE_OPTIONS[3];
}

function takeLast(items, count) {
  if (!Array.isArray(items) || !items.length) {
    return [];
  }
  return items.slice(-count);
}

function polylinePoints(values, width, height, padding, min, max) {
  if (!values.length) {
    return "";
  }
  const rangeMin = Number.isFinite(min) ? min : Math.min(...values);
  const rangeMax = Number.isFinite(max) ? max : Math.max(...values);
  const range = rangeMax - rangeMin || 1;
  return values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, values.length - 1);
    const y = height - padding - ((value - rangeMin) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
}

function buildChartScale(values, options = {}) {
  const numericValues = (values || []).filter(Number.isFinite);
  const ticks = options.ticks || 5;

  if (!numericValues.length) {
    const fallbackMin = Number(options.fallbackMin ?? 0);
    const fallbackMax = Number(options.fallbackMax ?? 100);
    return {
      min: fallbackMin,
      max: fallbackMax,
      labels: axisLabels(fallbackMin, fallbackMax, ticks)
    };
  }

  let min = Math.min(...numericValues);
  let max = Math.max(...numericValues);

  if (Number.isFinite(options.min)) {
    min = options.min;
  }
  if (Number.isFinite(options.max)) {
    max = options.max;
  }

  if (min === max) {
    const delta = Math.abs(min || 1) * 0.02 || 1;
    min -= delta;
    max += delta;
  } else {
    const paddingRatio = Number.isFinite(options.paddingRatio) ? options.paddingRatio : 0.08;
    const paddingValue = (max - min) * paddingRatio;
    min -= paddingValue;
    max += paddingValue;
  }

  return {
    min,
    max,
    labels: axisLabels(min, max, ticks)
  };
}

function axisLabels(min, max, ticks = 5) {
  const safeTicks = Math.max(2, ticks);
  const step = (max - min) / (safeTicks - 1 || 1);
  const labels = Array.from({ length: safeTicks }, (_, index) => formatNumber(max - step * index));
  return {
    high: labels[0],
    mid: labels[Math.floor((safeTicks - 1) / 2)],
    low: labels[labels.length - 1],
    all: labels
  };
}

function renderChartYAxis(labels) {
  return labels.map((label) => `<span>${label}</span>`).join("");
}

function renderChartGridLines(width, height, padding, tickCount) {
  return Array.from({ length: tickCount }, (_, index) => {
    const y = padding + (index * (height - padding * 2)) / Math.max(1, tickCount - 1);
    return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(16,24,40,0.08)" stroke-dasharray="4 6" />`;
  }).join("");
}

function buildXAxisLabels(items, formatter) {
  if (!Array.isArray(items) || !items.length) {
    return { start: "-", middle: "-", end: "-" };
  }
  const middleIndex = Math.floor((items.length - 1) / 2);
  return {
    start: formatter(items[0]),
    middle: formatter(items[middleIndex]),
    end: formatter(items[items.length - 1])
  };
}

function renderChartXAxis(labels) {
  return `
    <div class="chart-x-axis">
      <span>${labels.start}</span>
      <span>${labels.middle}</span>
      <span>${labels.end}</span>
    </div>
  `;
}

function formatChartDateLabel(value) {
  if (!value) {
    return "-";
  }
  const text = String(value);
  return text.length >= 10 ? text.slice(5) : text;
}

function syncDetailAutoRefresh() {
  if (state.detailAutoRefreshId) {
    clearInterval(state.detailAutoRefreshId);
    state.detailAutoRefreshId = null;
  }

  if (state.view !== "detail" || !state.selectedSymbol || state.detailRange !== "1d") {
    return;
  }

  state.detailAutoRefreshId = window.setInterval(() => {
    loadStockDetail(state.selectedSymbol, { focus: false, pushHistory: false, silent: true });
  }, 60000);
}

function getRangeSeries(detail) {
  const range = getRangeOption(state.detailRange);
  const chartCount = range.chartCount || range.count;
  return {
    range,
    candles: takeLast(detail.series.candles || [], chartCount),
    macd: takeLast(detail.series.macd || [], chartCount),
    kdj: takeLast(detail.series.kdj || [], chartCount),
    window: detail.windows?.[range.key] || {}
  };
}

function buildIndicatorSnapshot(detail) {
  const { range, window } = getRangeSeries(detail);
  const latestMacd = detail.latestIndicators.macd || {};
  const latestKdj = detail.latestIndicators.kdj || {};
  elements.indicatorSnapshot.innerHTML = [
    { label: `${range.label}收盤`, value: window.close, note: `成交量 ${formatNumber(window.volume, 0)}` },
    { label: `${range.label}MACD`, value: window.macdLine ?? latestMacd.macdLine, note: `慢線 ${formatNumber(window.signalLine ?? latestMacd.signalLine)}` },
    { label: `${range.label}KD`, value: window.k ?? latestKdj.k, note: `D ${formatNumber(window.d ?? latestKdj.d)}` },
    { label: "圖表重點", value: range.label, note: "MACD 與 KD 已拆成兩張圖表。" }
  ].map((card) => `
    <div class="compact-indicator-card">
      <span>${card.label}</span>
      <strong>${formatNumber(card.value)}</strong>
      <small>${card.note}</small>
    </div>
  `).join("");

  elements.indicatorSnapshotDetail.innerHTML = `
    <div class="chart-insights">
      <div class="chart-stat"><span>MACD 快線</span><strong>${formatNumber(latestMacd.macdLine)}</strong></div>
      <div class="chart-stat"><span>MACD 慢線</span><strong>${formatNumber(latestMacd.signalLine)}</strong></div>
      <div class="chart-stat"><span>柱狀體</span><strong>${formatNumber(latestMacd.histogram)}</strong></div>
      <div class="chart-stat"><span>K / D</span><strong>${formatNumber(latestKdj.k)} / ${formatNumber(latestKdj.d)}</strong></div>
    </div>
  `;
}

function renderRangeTabs() {
  elements.detailRangeTabs.innerHTML = "";
  RANGE_OPTIONS.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "range-tab";
    button.textContent = option.label;
    button.classList.toggle("active", option.key === state.detailRange);
    button.addEventListener("click", () => {
      state.detailRange = option.key;
      syncDetailAutoRefresh();
      if (state.detail) {
        renderDetailCharts(state.detail);
      }
    });
    elements.detailRangeTabs.appendChild(button);
  });
}

function renderPriceChart(detail) {
  const { range, candles, window } = getRangeSeries(detail);
  if (!candles.length) {
    elements.priceChart.innerHTML = "<p>目前沒有足夠的價格資料。</p>";
    return;
  }
  const width = 640;
  const height = 240;
  const padding = 24;
  const closes = candles.map((item) => Number(item.close)).filter(Number.isFinite);
  const volumes = candles.map((item) => Number(item.volume)).filter(Number.isFinite);
  const dates = candles.map((item) => item.date);
  const closeScale = buildChartScale(closes, { ticks: 5, paddingRatio: 0.06 });
  const closeMin = closeScale.min;
  const closeMax = closeScale.max;
  const closeLabels = closeScale.labels;
  const volumeMax = Math.max(...volumes, 1);
  const volumeAvg = average(volumes);
  const points = polylinePoints(closes, width, height, padding, closeMin, closeMax);
  const xAxisLabels = buildXAxisLabels(dates, formatChartDateLabel);
  const bars = candles.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, candles.length - 1);
    const barWidth = Math.max(4, (width - padding * 2) / Math.max(candles.length * 2, 16));
    const barHeight = ((Number(item.volume) || 0) / volumeMax) * 64;
    const y = height - padding - barHeight;
    return `<rect x="${x - barWidth / 2}" y="${y}" width="${barWidth}" height="${barHeight}" fill="rgba(44, 105, 209, 0.18)" rx="2" />`;
  }).join("");
  elements.priceChart.innerHTML = `
    <div class="chart-insights">
      <div class="chart-stat"><span>${range.label}收盤</span><strong>${formatNumber(window.close ?? closes.at(-1))}</strong></div>
      <div class="chart-stat"><span>${range.label}高 / 低</span><strong>${formatNumber(window.high ?? closeMax)} / ${formatNumber(window.low ?? closeMin)}</strong></div>
      <div class="chart-stat"><span>${range.label}成交量</span><strong>${formatNumber(window.volume ?? volumes.at(-1), 0)}</strong></div>
      <div class="chart-stat"><span>平均量</span><strong>${formatNumber(volumeAvg, 0)}</strong></div>
    </div>
    <div class="chart-legend">
      <span><i class="legend-dot legend-price"></i>收盤走勢</span>
      <span><i class="legend-dot legend-volume"></i>成交量</span>
      <span class="chart-caption">${dates[0]} 至 ${dates[dates.length - 1]}</span>
    </div>
    <div class="chart-svg-wrap">
      <div class="chart-y-axis">${renderChartYAxis(closeLabels.all)}</div>
      <div>
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${range.label}價格與成交量圖">
          ${renderChartGridLines(width, height, padding, closeLabels.all.length)}
          <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="rgba(16,24,40,0.08)" />
          ${bars}
          <polyline fill="none" stroke="#0b6e69" stroke-width="3" points="${points}" />
        </svg>
        ${renderChartXAxis(xAxisLabels)}
      </div>
    </div>
  `;
}

function renderIndicatorChart(detail) {
  const { range, macd } = getRangeSeries(detail);
  if (!macd.length) {
    elements.indicatorChart.innerHTML = "<p>目前沒有足夠的 MACD 資料。</p>";
    return;
  }
  const width = 640;
  const height = 240;
  const padding = 24;
  const macdLine = macd.map((item) => Number(item.macdLine)).filter(Number.isFinite);
  const signalLine = macd.map((item) => Number(item.signalLine)).filter(Number.isFinite);
  const histogram = macd.map((item) => Number(item.histogram)).filter(Number.isFinite);
  const source = [...macdLine, ...signalLine, ...histogram].filter(Number.isFinite);
  const scale = buildChartScale(source, { ticks: 5, paddingRatio: 0.1, fallbackMin: -1, fallbackMax: 1 });
  const min = scale.min;
  const max = scale.max;
  const labels = scale.labels;
  const xAxisLabels = buildXAxisLabels(macd, (item) => formatChartDateLabel(item?.date));
  const histogramBars = macd.map((item, index) => {
    const value = Number(item.histogram);
    if (!Number.isFinite(value)) {
      return "";
    }
    const x = padding + (index * (width - padding * 2)) / Math.max(1, macd.length - 1);
    const barWidth = Math.max(4, (width - padding * 2) / Math.max(macd.length * 2, 16));
    const zeroY = height - padding - ((0 - min) / ((max - min) || 1)) * (height - padding * 2);
    const barY = value >= 0 ? zeroY - (Math.abs(value) / ((max - min) || 1)) * (height - padding * 2) : zeroY;
    const barHeight = (Math.abs(value) / ((max - min) || 1)) * (height - padding * 2);
    return `<rect x="${x - barWidth / 2}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${value >= 0 ? "rgba(11,110,105,0.18)" : "rgba(212,106,31,0.18)"}" rx="2" />`;
  }).join("");
  elements.indicatorChart.innerHTML = `
    <div class="chart-insights">
      <div class="chart-stat"><span>${range.label}MACD</span><strong>${formatNumber(macd.at(-1)?.macdLine ?? detail.latestIndicators.macd?.macdLine)}</strong></div>
      <div class="chart-stat"><span>MACD 慢線</span><strong>${formatNumber(macd.at(-1)?.signalLine ?? detail.latestIndicators.macd?.signalLine)}</strong></div>
      <div class="chart-stat"><span>柱狀體</span><strong>${formatNumber(macd.at(-1)?.histogram ?? detail.latestIndicators.macd?.histogram)}</strong></div>
      <div class="chart-stat"><span>區間</span><strong>${range.label}</strong></div>
    </div>
    <div class="chart-legend">
      <span><i class="legend-dot legend-macd"></i>MACD 快線</span>
      <span><i class="legend-dot legend-signal"></i>MACD 慢線</span>
      <span><i class="legend-dot legend-volume"></i>柱狀體</span>
    </div>
    <div class="chart-svg-wrap">
      <div class="chart-y-axis">${renderChartYAxis(labels.all)}</div>
      <div>
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${range.label}MACD 圖">
          ${renderChartGridLines(width, height, padding, labels.all.length)}
          <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="rgba(16,24,40,0.08)" />
          ${histogramBars}
          <polyline fill="none" stroke="#d46a1f" stroke-width="2.5" points="${polylinePoints(macdLine, width, height, padding, min, max)}" />
          <polyline fill="none" stroke="#2c69d1" stroke-width="2.5" points="${polylinePoints(signalLine, width, height, padding, min, max)}" />
        </svg>
        ${renderChartXAxis(xAxisLabels)}
      </div>
    </div>
  `;
}

function renderKdChart(detail) {
  const { range, kdj } = getRangeSeries(detail);
  if (!kdj.length) {
    elements.kdChart.innerHTML = "<p>目前沒有足夠的 KD 資料。</p>";
    return;
  }
  const width = 640;
  const height = 240;
  const padding = 24;
  const kLine = kdj.map((item) => Number(item.k)).filter(Number.isFinite);
  const dLine = kdj.map((item) => Number(item.d)).filter(Number.isFinite);
  const source = [...kLine, ...dLine].filter(Number.isFinite);
  const scale = buildChartScale(source, { ticks: 5, paddingRatio: 0.08, fallbackMin: 0, fallbackMax: 100 });
  const min = scale.min;
  const max = scale.max;
  const labels = scale.labels;
  const xAxisLabels = buildXAxisLabels(kdj, (item) => formatChartDateLabel(item?.date));
  elements.kdChart.innerHTML = `
    <div class="chart-insights">
      <div class="chart-stat"><span>${range.label}K 值</span><strong>${formatNumber(kdj.at(-1)?.k ?? detail.latestIndicators.kdj?.k)}</strong></div>
      <div class="chart-stat"><span>${range.label}D 值</span><strong>${formatNumber(kdj.at(-1)?.d ?? detail.latestIndicators.kdj?.d)}</strong></div>
      <div class="chart-stat"><span>K / D</span><strong>${formatNumber(detail.latestIndicators.kdj?.k)} / ${formatNumber(detail.latestIndicators.kdj?.d)}</strong></div>
      <div class="chart-stat"><span>交叉狀態</span><strong>${(detail.latestIndicators.kdj?.k ?? 0) >= (detail.latestIndicators.kdj?.d ?? 0) ? "K 在 D 上方" : "D 在 K 上方"}</strong></div>
    </div>
    <div class="chart-legend">
      <span><i class="legend-dot legend-k"></i>K 線</span>
      <span><i class="legend-dot legend-d"></i>D 線</span>
    </div>
    <div class="chart-svg-wrap">
      <div class="chart-y-axis">${renderChartYAxis(labels.all)}</div>
      <div>
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${range.label}KD 圖">
          ${renderChartGridLines(width, height, padding, labels.all.length)}
          <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="rgba(16,24,40,0.08)" />
          <polyline fill="none" stroke="#0b6e69" stroke-width="2.5" points="${polylinePoints(kLine, width, height, padding, min, max)}" />
          <polyline fill="none" stroke="#7a445f" stroke-width="2.5" points="${polylinePoints(dLine, width, height, padding, min, max)}" />
        </svg>
        ${renderChartXAxis(xAxisLabels)}
      </div>
    </div>
  `;
}

function renderDetailCharts(detail) {
  renderRangeTabs();
  buildIndicatorSnapshot(detail);
  renderPriceChart(detail);
  renderIndicatorChart(detail);
  renderKdChart(detail);
}

function renderDetail(detail) {
  state.selectedSymbol = detail.symbol;
  state.detail = detail;
  elements.detailTitle.textContent = "單股分析";
  elements.detailDateLabel.textContent = detail.quote.tradeDate ? `交易日期 ${detail.quote.tradeDate}` : "尚未取得交易日期";
  elements.detailSymbol.textContent = detail.symbol;
  elements.detailName.textContent = detail.quote.name || detail.symbol;
  elements.detailClosePrice.textContent = formatNumber(detail.quote.closePrice);

  const change = detail.quote.change;
  const changePercent = detail.quote.changePercent;
  elements.detailChange.textContent = change === null || change === undefined
    ? "-"
    : `${change >= 0 ? "+" : ""}${formatNumber(change)} (${changePercent >= 0 ? "+" : ""}${formatNumber(changePercent)}%)`;

  elements.detailProfileBadges.innerHTML = "";
  [detail.profile.market, detail.profile.industry, ...(detail.profile.sectors || []).map((sector) => sector.label)]
    .filter(Boolean)
    .forEach((label) => {
      const node = document.createElement("span");
      node.className = "detail-badge";
      node.textContent = label;
      elements.detailProfileBadges.appendChild(node);
    });

  elements.detailHorizonScores.innerHTML = [
    { key: "short", label: "短期" },
    { key: "mid", label: "中期" },
    { key: "long", label: "長期" }
  ].map((item) => {
    const score = detail.horizonScores[item.key];
    return `<article class="horizon-score-card"><span>${item.label}</span><strong>${score.score} 分 ${stars(score.stars)}</strong><p>${score.biasLabel}</p></article>`;
  }).join("");

  appendListItems(elements.detailBullishReasons, detail.horizonScores[state.horizon].bullishReasons, "目前沒有明確看漲因素。");
  appendListItems(elements.detailRiskReasons, detail.horizonScores[state.horizon].riskReasons, "目前沒有明確風險提醒。");

  elements.detailMetrics.innerHTML = `
    <section class="metrics-panel">
      <div class="metrics-panel-head">
        <span class="panel-label">報價總覽</span>
      </div>
      <div class="metrics-panel-grid">
        ${[
          { label: "開盤", value: detail.quote.openPrice },
          { label: "最高", value: detail.quote.highPrice },
          { label: "最低", value: detail.quote.lowPrice },
          { label: "昨收", value: detail.quote.previousClose },
          { label: "成交量", value: detail.quote.tradeVolume, digits: 0 }
        ].map((item) => `<div class="metric-chip"><span>${item.label}</span><strong>${formatNumber(item.value, item.digits ?? 2)}</strong></div>`).join("")}
      </div>
    </section>
  `;

  bindFavoriteButton(elements.detailFavoriteButton, { symbol: detail.symbol, name: detail.quote.name || detail.symbol });
  renderDetailCharts(detail);
  syncDetailAutoRefresh();
  setDetailState(`單股資料來源 ${detail.profile.universeSource} | 前端版本 ${BUILD_VERSION}`);
}

function renderDetailError(message) {
  state.detail = null;
  state.selectedSymbol = "";
  elements.detailTitle.textContent = "單股分析";
  elements.detailDateLabel.textContent = "查詢失敗";
  elements.detailSymbol.textContent = "-";
  elements.detailName.textContent = message;
  elements.detailClosePrice.textContent = "-";
  elements.detailChange.textContent = "-";
  elements.detailProfileBadges.innerHTML = "";
  elements.detailHorizonScores.innerHTML = "";
  elements.detailMetrics.innerHTML = "";
  elements.indicatorSnapshot.innerHTML = "";
  elements.indicatorSnapshotDetail.innerHTML = "";
  elements.detailRangeTabs.innerHTML = "";
  elements.detailBullishReasons.innerHTML = "";
  elements.detailRiskReasons.innerHTML = "";
  elements.priceChart.innerHTML = "<p>目前無法顯示價格圖表。</p>";
  elements.indicatorChart.innerHTML = "<p>目前無法顯示 MACD 圖表。</p>";
  elements.kdChart.innerHTML = "<p>目前無法顯示 KD 圖表。</p>";
  syncFavoriteButtons();
  syncDetailAutoRefresh();
  setDetailState(message);
}

function renderDetailLoading(symbol) {
  elements.detailTitle.textContent = "單股分析";
  setDetailState("正在整理單股資料與技術圖表...");
}

async function loadSectors() {
  const result = await fetchJson("/api/sectors");
  state.sectors = result.sectors;
  renderSectorTabs();
  renderHorizonTabs();
}

async function loadAnalysis() {
  renderSectorTabs();
  renderHorizonTabs();
  elements.generatedAtLabel.textContent = "資料載入中";
  try {
    const result = await fetchJson(`/api/analysis?sector=${state.sector}&horizon=${state.horizon}`);
    renderSummary(result);
    renderStocks(result);
    syncFavoriteButtons();
  } catch (error) {
    elements.stockList.innerHTML = `<article class="note-card"><h3>資料載入失敗</h3><p>${error.message}</p></article>`;
    elements.generatedAtLabel.textContent = "資料載入失敗";
    elements.dataSourceBadge.textContent = "資料載入失敗";
  }
}

async function loadStockDetail(symbol, options = {}) {
  const { focus = false, pushHistory = false, silent = false } = options;
  if (!silent) {
    renderDetailLoading(symbol);
  }
  try {
    const detail = await fetchJson(`/api/stock/${symbol}`);
    renderDetail(detail);
    if (focus) {
      setViewMode("detail");
    }
    if (pushHistory) {
      syncHistory(symbol);
    }
  } catch (error) {
    renderDetailError(error.message);
    if (focus) {
      setViewMode("detail");
    }
  }
}

function goHome(options = {}) {
  setViewMode("home", { scroll: true });
  if (options.pushHistory) {
    syncHistory("");
  }
  syncDetailAutoRefresh();
}

elements.refreshButton.addEventListener("click", () => {
  loadAnalysis();
  if (elements.stockSymbolInput.value.trim()) {
    loadStockDetail(elements.stockSymbolInput.value.trim());
  }
});

elements.watchlistManagerButton.addEventListener("click", openWatchlistDrawer);
elements.watchlistQuickOpenButton.addEventListener("click", openWatchlistDrawer);
elements.closeWatchlistDrawerButton.addEventListener("click", closeWatchlistDrawer);
elements.watchlistDrawer.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeWatchlist === "true") {
    closeWatchlistDrawer();
  }
});

elements.addWatchlistButton.addEventListener("click", () => {
  const name = window.prompt("請輸入新的自選組合名稱", `自選${state.watchlists.length + 1}`);
  if (!name || !name.trim()) {
    return;
  }
  createWatchlist(name.trim());
});

elements.renameWatchlistButton.addEventListener("click", () => {
  const active = getActiveWatchlist();
  if (!active) {
    return;
  }
  const name = window.prompt("請輸入新的組合名稱", active.name);
  if (!name || !name.trim()) {
    return;
  }
  renameActiveWatchlist(name.trim());
});

elements.deleteWatchlistButton.addEventListener("click", () => {
  const active = getActiveWatchlist();
  if (active && window.confirm(`確定要刪除「${active.name}」嗎？`)) {
    deleteActiveWatchlist();
  }
});

elements.backToHomeButton.addEventListener("click", () => goHome({ pushHistory: true }));

elements.stockSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const symbol = state.searchSelectedSymbol || elements.stockSymbolInput.value.trim();
  if (!symbol) {
    renderDetailError("請輸入股票代碼或股票名稱。");
    return;
  }
  clearSearchSuggestions();
  await loadStockDetail(symbol, { focus: true, pushHistory: true });
});

elements.stockSymbolInput.addEventListener("input", () => {
  state.searchSelectedSymbol = "";
  clearTimeout(state.searchDebounceId);
  const query = elements.stockSymbolInput.value.trim();
  if (!query) {
    clearSearchSuggestions();
    return;
  }
  state.searchDebounceId = window.setTimeout(() => {
    loadSearchSuggestions(query);
  }, 180);
});

elements.stockSymbolInput.addEventListener("keydown", (event) => {
  if (!state.searchSuggestions.length) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.searchActiveIndex = (state.searchActiveIndex + 1) % state.searchSuggestions.length;
    renderSearchSuggestions(state.searchSuggestions);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    state.searchActiveIndex = (state.searchActiveIndex - 1 + state.searchSuggestions.length) % state.searchSuggestions.length;
    renderSearchSuggestions(state.searchSuggestions);
  } else if (event.key === "Enter" && state.searchActiveIndex >= 0) {
    event.preventDefault();
    const item = state.searchSuggestions[state.searchActiveIndex];
    applySearchSuggestion(item);
    loadStockDetail(item.symbol, { focus: true, pushHistory: true });
  } else if (event.key === "Escape") {
    clearSearchSuggestions();
  }
});

elements.stockSymbolInput.addEventListener("blur", () => {
  window.setTimeout(() => {
    clearSearchSuggestions();
  }, 120);
});

elements.searchSuggestions.addEventListener("click", (event) => {
  const target = event.target.closest("[data-suggestion-index]");
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const item = state.searchSuggestions[Number(target.dataset.suggestionIndex)];
  if (!item) {
    return;
  }
  applySearchSuggestion(item);
  loadStockDetail(item.symbol, { focus: true, pushHistory: true });
});

window.addEventListener("popstate", () => {
  const symbol = new URL(window.location.href).searchParams.get("stock");
  if (symbol) {
    elements.stockSymbolInput.value = symbol;
    loadStockDetail(symbol, { focus: true, pushHistory: false });
  } else {
    goHome({ pushHistory: false });
  }
});

async function bootstrap() {
  loadWatchlists();
  renderWatchlistPreview();
  renderWatchlistDrawer();
  await loadSectors();
  await loadAnalysis();
  const symbolFromUrl = new URL(window.location.href).searchParams.get("stock");
  if (symbolFromUrl) {
    elements.stockSymbolInput.value = symbolFromUrl;
    await loadStockDetail(symbolFromUrl, { focus: true, pushHistory: false });
    return;
  }
  elements.stockSymbolInput.value = "2330";
  loadStockDetail("2330");
}

bootstrap().catch((error) => {
  elements.stockList.innerHTML = `<article class="note-card"><h3>資料載入失敗</h3><p>${error.message}</p></article>`;
  elements.dataSourceBadge.textContent = "資料載入失敗";
});
