const { searchStocks } = require("../server/services/sectorService");

module.exports = async function handler(request, response) {
  try {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    const q = request.query.q || "";
    const horizon = request.query.horizon || "short";
    const limit = request.query.limit || 8;

    response.status(200).json({
      items: await searchStocks(q, horizon, limit)
    });
  } catch (error) {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(error.status || 500).json({
      error: "SEARCH_FAILED",
      message: error.message,
      detail: error.detail || null
    });
  }
};
