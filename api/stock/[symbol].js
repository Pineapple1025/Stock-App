const { getStockDetail } = require("../../server/services/sectorService");

module.exports = async function handler(request, response) {
  try {
    const result = await getStockDetail(request.query.symbol);
    response.status(200).json(result);
  } catch (error) {
    response.status(error.status || 500).json({
      error: "STOCK_DETAIL_FAILED",
      message: error.message,
      detail: error.detail || null
    });
  }
};
