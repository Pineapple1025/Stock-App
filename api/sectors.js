const { getSectors } = require("../server/services/sectorService");

module.exports = async function handler(_request, response) {
  try {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(200).json({
      sectors: await getSectors()
    });
  } catch (error) {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.status(error.status || 500).json({
      error: "SECTOR_LIST_FAILED",
      message: error.message,
      detail: error.detail || null
    });
  }
};
