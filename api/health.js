module.exports = async function handler(_request, response) {
  response.status(200).json({
    ok: true,
    service: "tw-stock-analyzer",
    time: new Date().toISOString()
  });
};
