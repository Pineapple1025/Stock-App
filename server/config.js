const path = require("path");

module.exports = {
  port: Number(process.env.PORT || 3000),
  fugleApiKey: process.env.FUGLE_API_KEY || "",
  projectRoot: path.resolve(__dirname, ".."),
  publicDir: path.resolve(__dirname, "..", "public"),
  fugleBaseUrl: "https://api.fugle.tw/marketdata/v1.0/stock"
};
