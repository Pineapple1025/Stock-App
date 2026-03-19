const { getSectorAnalysis } = require("../server/services/sectorService");

module.exports = async function handler(request, response) {
  try {
    const sector = request.query.sector || "ai";
    const horizon = request.query.horizon || "short";
    const result = await getSectorAnalysis(sector, horizon);
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(200).json(result);
  } catch (error) {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(error.status || 500).json({
      error: "ANALYSIS_FAILED",
      message: error.message,
      detail: error.detail || null
    });
  }
};
