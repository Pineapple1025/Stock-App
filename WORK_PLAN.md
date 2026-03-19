# Stock App 專案進度追蹤

## 專案摘要

- 專案名稱：台股分析網站
- 市場範圍：台股
- 資料來源：Fugle API
- 主要功能：
  - 產業分類分析頁
  - 單一股票詳情頁
- 模型規劃：
  - 短期：TCN-Transformer / MASTER
  - 中期：XGBoost / LightGBM
  - 長期：Bayesian Neural Networks

## 狀態說明

- `TODO`：尚未開始
- `進行中`：正在處理
- `阻塞中`：等待資料、工具或決策
- `已完成`：已完成

## 目前總覽

| 項目 | 狀態 | 說明 |
| --- | --- | --- |
| 前端頁面骨架 | `已完成` | 已有分類頁與單股詳情區塊 |
| 後端 API 骨架 | `已完成` | Express 路由與 Fugle client 已建立 |
| Fugle API Key 設定 | `已完成` | `.env` 已建立 |
| 分類 / 股票 / 對應資料結構 | `已完成` | 已拆成可維護結構 |
| 單股詳情 API | `已完成` | `/api/stock/:symbol` 已可用 |
| 多區間 MACD / KDJ / 成交量 | `已完成` | 已支援 1D / 3D / 5D / 1M / 3M / 6M / 1Y |
| 單股詳情圖表 | `已完成` | 已有價格 / 成交量圖與指標圖 |
| 完整股票池匯入 | `進行中` | 已加入官方資料驅動的 universe service |
| 基本面資料補強 | `TODO` | 營收、EPS、ROE 仍有 fallback |
| 模型訓練流程 | `TODO` | 尚未開始 |
| 部署與正式驗證 | `TODO` | 尚未完成 |

## Phase 1：需求與目標確認

### 任務

- [x] 確認只做台股
- [x] 確認主要產業分類
- [x] 確認 Fugle API Key 可用
- [x] 確認短 / 中 / 長期模型方向
- [ ] 定義短期、中期、長期「看漲」標準
- [ ] 確認分數依據是絕對報酬還是相對大盤
- [ ] 確認是否要加入停損 / 風險分級

### 輸出

- 狀態：`進行中`
- 目前阻塞：
  - 看漲標籤與評分標準還沒完全定義

## Phase 2：資料架構

### 任務

- [x] 建立分類主表
- [x] 建立股票主表
- [x] 建立分類對應表
- [x] 支援一檔股票對應多個分類
- [x] 加入資料來源欄位
- [ ] 加入熱門度 / 排序欄位
- [x] 建立可延伸的匯入式資料結構
- [ ] 完成 TWSE / TPEX 全量股票池正規化

### 輸出

- 狀態：`進行中`
- 主要檔案：
  - `server/data/sectors.js`
  - `server/services/stockUniverseService.js`

## Phase 3：後端 API

### 任務

- [x] 建立健康檢查 API
- [x] 建立分類列表 API
- [x] 建立分類分析 API
- [x] 建立單股詳情 API
- [x] 串接 Fugle 即時報價
- [x] 串接歷史 K 線
- [x] 串接 SMA
- [x] 串接 RSI
- [x] 串接 MACD
- [x] 串接 KDJ
- [ ] 補強 API 錯誤格式統一
- [ ] 加入快取策略
- [ ] 加入 API rate limit 保護
- [ ] 建立背景更新流程

### 輸出

- 狀態：`進行中`
- 主要檔案：
  - `server/index.js`
  - `server/services/fugleClient.js`
  - `server/services/sectorService.js`
  - `server/services/analysisEngine.js`
  - `server/services/stockUniverseService.js`

## Phase 4：前端體驗

### 任務

- [x] 建立分類切換 UI
- [x] 建立短 / 中 / 長期切換
- [x] 顯示排名股票卡片
- [x] 建立單股搜尋
- [x] 建立單股詳情摘要
- [x] 顯示最新 MACD / KDJ
- [x] 顯示 1D / 3D / 5D / 1M / 3M / 6M / 1Y 區間資料
- [x] 支援點卡片直接切換到單股詳情
- [x] 加入圖表區塊
- [x] 加入詳情頁 loading 狀態
- [x] 加入無效代碼 / 錯誤提示
- [ ] 手機版細節優化
- [ ] 視覺與中文文案最後整理

### 輸出

- 狀態：`進行中`
- 主要檔案：
  - `public/index.html`
  - `public/styles.css`
  - `public/app.js`

## Phase 5：評分與解釋

### 任務

- [x] 建立短期評分邏輯
- [x] 建立中期評分邏輯
- [x] 建立長期評分邏輯
- [x] 將分數轉為 1 到 5 星
- [x] 顯示看漲參考因素
- [x] 顯示風險提醒
- [x] 顯示信心分數
- [ ] 讓權重可調整
- [ ] 加入相對大盤排名模式
- [ ] 為未來模型輸出保留解釋層

### 輸出

- 狀態：`進行中`

## Phase 6：模型流程

### 短期

- [ ] 定義 5 / 10 / 20 日標籤
- [ ] 建立 TCN-Transformer 訓練資料集
- [ ] 評估是否切到 MASTER 結構
- [ ] 建立訓練腳本
- [ ] 建立驗證報告

### 中期

- [ ] 定義 1 到 3 個月標籤
- [ ] 建立表格型特徵資料集
- [ ] 訓練 XGBoost baseline
- [ ] 訓練 LightGBM 對照模型
- [ ] 產出特徵重要度報告

### 長期

- [ ] 定義 3 到 12 個月標籤
- [ ] 建立長期基本面特徵集
- [ ] 訓練 Bayesian Neural Network baseline
- [ ] 加入不確定性輸出
- [ ] 產出驗證報告

### 輸出

- 狀態：`TODO`

## Phase 7：基本面與財務資料補強

### 任務

- [ ] 確認 Fugle 是否足夠提供營收 / EPS / ROE / 估值欄位
- [ ] 若 Fugle 不足，補其他資料來源
- [ ] 用真實資料取代 fallback 的營收 / EPS / ROE
- [ ] 加入法人籌碼資料
- [ ] 加入估值指標

### 輸出

- 狀態：`TODO`
- 風險：
  - 這一階段取決於 API 方案與實際欄位可用性

## Phase 8：部署與維運

### 任務

- [ ] 安裝 Node.js 到目標環境
- [ ] 執行 `npm install`
- [ ] 本機完整啟動驗證
- [ ] 建立 production env 範本
- [x] 建立 GitHub repo 並同步
- [ ] 準備部署環境
- [ ] 加入基本 log / monitoring

### 輸出

- 狀態：`阻塞中`
- 阻塞原因：
  - 目前開發過程中未完整做 runtime 驗證

## 目前最優先待辦

### Priority 1

- [ ] 完成 TWSE / TPEX 全量股票池正規化
- [ ] 補齊詳情頁圖表與真實資料的整合驗證
- [ ] 補上更多真實基本面欄位

### Priority 2

- [ ] 加入快取策略與 API 保護
- [ ] 加入股票熱門度 / 排序邏輯
- [ ] 讓詳情頁支援更完整的圖形分析

### Priority 3

- [ ] 開始模型資料集設計
- [ ] 定義 benchmark 與回測方式

## 需要你確認的事項

- [ ] 短 / 中 / 長期的看漲標準
- [ ] 排名依據是絕對報酬還是相對大盤
- [ ] 概念股顯示只保留前 20，還是全部映射股票
- [ ] 下一步要不要優先補圖表或模型資料集

## 備註

- 目前 repo 與 GitHub 已同步。
- 單股詳情頁目前已支援：
  - 基本報價
  - 短 / 中 / 長期分數
  - 最新 MACD / KDJ
  - 1D / 3D / 5D / 1M / 3M / 6M / 1Y 區間快照
  - 價格 / 成交量圖
  - MACD / KDJ 圖
- 目前股票 universe 已從純手動清單升級為「官方資料 + fallback」的方向，但尚未完成完整台股全量正規化。
