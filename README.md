# 台股看漲分析網站

這個專案現在已整理成前後端架構，目標是做一個以 `Fugle API` 為資料來源的台股分析網站。

## 目前架構

- `public/`
  - `index.html`：正式前端頁面
  - `styles.css`：簡潔、乾淨但帶色彩層次的視覺設計
  - `app.js`：前端互動與 API 串接
- `server/`
  - `index.js`：Express 伺服器與 API 路由
  - `config.js`：環境設定
  - `data/sectors.js`：台股分類主表、股票主表、分類對應表
  - `services/fugleClient.js`：Fugle API client
  - `services/analysisEngine.js`：評分與理由生成
  - `services/sectorService.js`：分類分析整合層
- `.env.example`：環境變數範例
- `WORK_PLAN.md`：專案工作計畫

## 目前完成內容

- 台股限定版本
- 產業分類：
  - AI
  - 半導體
  - 電子
  - 工業
  - 醫療
  - 金融
  - 能源
  - 國防航太
  - 綠能
  - 原物料
- 前端可切換分類與短 / 中 / 長期
- 前端可輸入股票代碼查詢單一個股
- 單股頁會顯示市場別、產業、所屬分類、短中長期總評、技術指標與多區間成交量摘要
- 後端 API 路由：
  - `GET /api/health`
  - `GET /api/sectors`
  - `GET /api/analysis?sector=ai&horizon=short`
  - `GET /api/stock/:symbol`
- Fugle API 串接骨架已接上：
  - `intraday/quote`
  - `historical/candles`
  - `technical/sma`
  - `technical/rsi`
  - `technical/macd`
  - `technical/kdj`
- 若 API key 未設定或 API 發生錯誤，系統會自動回退到備援示範資料

## 模型規劃

- 短期：`TCN-Transformer`，備選 `MASTER`
- 中期：`XGBoost / LightGBM`
- 長期：`Bayesian Neural Networks`

目前網站先以規則型分數輸出畫面，方便先把資料流、頁面架構與說明文字建好。之後再把模型預測結果接到同一個輸出格式。

## Fugle 文件依據

目前後端串接是依 Fugle 官方文件規劃：

- 開始使用：https://developer.fugle.tw/docs/data/http-api/getting-started/
- 即時報價：https://developer.fugle.tw/docs/data/http-api/intraday/quote/
- 歷史 K 線：https://developer.fugle.tw/docs/data/http-api/historical/candles/
- SMA：https://developer.fugle.tw/docs/data/http-api/technical/sma/
- RSI：https://developer.fugle.tw/docs/data/http-api/technical/rsi/
- MACD：https://developer.fugle.tw/docs/data/http-api/technical/macd/

## 如何啟動

這份專案需要 `Node.js`。

1. 安裝 Node.js 18 以上版本
2. 建立 `.env`
3. 放入：

```env
FUGLE_API_KEY=你的金鑰
PORT=3000
```

4. 安裝套件：

```bash
npm install
```

5. 啟動：

```bash
npm run dev
```

6. 開啟：

```text
http://localhost:3000
```

## 目前限制

- 我這次工作的環境裡沒有 `Node.js` 與 `npm`，所以我已經把架構和程式碼建好，但還沒有在本機實跑驗證。
- 法人、營收、EPS、ROE 等欄位目前仍先以可替換的備援值表示，等你確認 Fugle 可用欄位或補充其他資料源後再接正式資料。

## 建議下一步

1. 先安裝 Node.js 並啟動這版
2. 確認每個產業分類要不要調整股票池
3. 告訴我你的 Fugle 方案可用欄位
4. 我再幫你補：
   - 真正的財報 / 籌碼資料來源
   - 模型訓練骨架
   - 管理股票池的後台設定
   - 完整股票池批量匯入
