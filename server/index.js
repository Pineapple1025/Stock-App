require("dotenv").config();

const express = require("express");
const path = require("path");
const { port, publicDir } = require("./config");
const { getSectors, getSectorAnalysis, getStockDetail } = require("./services/sectorService");

const app = express();

app.use(express.json());
app.use(express.static(publicDir));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "tw-stock-analyzer",
    time: new Date().toISOString()
  });
});

app.get("/api/sectors", async (_request, response) => {
  try {
    response.json({
      sectors: await getSectors()
    });
  } catch (error) {
    response.status(error.status || 500).json({
      error: "SECTOR_LIST_FAILED",
      message: error.message,
      detail: error.detail || null
    });
  }
});

app.get("/api/analysis", async (request, response) => {
  try {
    const sector = request.query.sector || "ai";
    const horizon = request.query.horizon || "short";
    const result = await getSectorAnalysis(sector, horizon);
    response.json(result);
  } catch (error) {
    response.status(error.status || 500).json({
      error: "ANALYSIS_FAILED",
      message: error.message,
      detail: error.detail || null
    });
  }
});

app.get("/api/stock/:symbol", async (request, response) => {
  try {
    const result = await getStockDetail(request.params.symbol);
    response.json(result);
  } catch (error) {
    response.status(error.status || 500).json({
      error: "STOCK_DETAIL_FAILED",
      message: error.message,
      detail: error.detail || null
    });
  }
});

app.get("*", (_request, response) => {
  response.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
