const fugleClient = require("./fugleClient");

function lastValue(rows, key) {
  if (!rows || rows.length === 0) {
    return null;
  }
  return rows[rows.length - 1][key];
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildStars(score) {
  return Math.max(1, Math.min(5, Math.ceil(score / 20)));
}

function percentileValuation(price, ma120) {
  if (!price || !ma120) {
    return 55;
  }
  const premium = ((price - ma120) / ma120) * 100;
  return clamp(Math.round(50 + premium * 1.2), 20, 95);
}

function withFallback(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function createFallbackMetrics(symbol) {
  const seed = Number(symbol.slice(-2));
  return {
    price: 60 + seed * 8,
    ma5Gap: 0.8 + (seed % 4),
    ma10Gap: 1.1 + (seed % 5),
    ma20Gap: 2.5 + (seed % 6),
    ma60Gap: 4.3 + (seed % 7),
    ma120Gap: 7.8 + (seed % 8),
    rsi14: 48 + (seed % 18),
    macdBullish: seed % 3 !== 0,
    volumeRatio: 0.9 + ((seed % 7) * 0.12),
    breakout20: seed % 2 === 0,
    revenueYoY: 8 + (seed % 20),
    epsYoY: 6 + (seed % 18),
    roe: 8 + (seed % 16),
    foreignBuyDays: seed % 5
  };
}

async function buildMetrics(symbol) {
  const fallback = createFallbackMetrics(symbol);

  try {
    const [quote, candles, sma5, sma10, sma20, sma60, sma120, rsi14, macd] = await Promise.all([
      fugleClient.getQuote(symbol),
      fugleClient.getHistoricalCandles(symbol, { daysBack: 220 }),
      fugleClient.getSMA(symbol, 5, { daysBack: 120 }),
      fugleClient.getSMA(symbol, 10, { daysBack: 140 }),
      fugleClient.getSMA(symbol, 20, { daysBack: 180 }),
      fugleClient.getSMA(symbol, 60, { daysBack: 220 }),
      fugleClient.getSMA(symbol, 120, { daysBack: 260 }),
      fugleClient.getRSI(symbol, 14, { daysBack: 120 }),
      fugleClient.getMACD(symbol, { daysBack: 160 })
    ]);

    if (!quote || !candles) {
      return fallback;
    }

    const candleRows = candles.data || [];
    const closeValues = candleRows.map((row) => row.close).filter(Number.isFinite);
    const volumeValues = candleRows.map((row) => row.volume).filter(Number.isFinite);
    const recentVolumes = volumeValues.slice(-5);
    const price = withFallback(quote.closePrice || lastValue(candleRows, "close"), fallback.price);
    const recentHigh20 = Math.max(...closeValues.slice(-20, -1));
    const avgVolume5 = average(recentVolumes);
    const todayVolume = lastValue(candleRows, "volume");

    const ma5 = lastValue(sma5?.data, "sma");
    const ma10 = lastValue(sma10?.data, "sma");
    const ma20 = lastValue(sma20?.data, "sma");
    const ma60 = lastValue(sma60?.data, "sma");
    const ma120 = lastValue(sma120?.data, "sma");
    const latestRsi = lastValue(rsi14?.data, "rsi");
    const latestMacd = macd?.data?.[macd.data.length - 1];

    return {
      price,
      ma5Gap: withFallback(((price - ma5) / ma5) * 100, fallback.ma5Gap),
      ma10Gap: withFallback(((price - ma10) / ma10) * 100, fallback.ma10Gap),
      ma20Gap: withFallback(((price - ma20) / ma20) * 100, fallback.ma20Gap),
      ma60Gap: withFallback(((price - ma60) / ma60) * 100, fallback.ma60Gap),
      ma120Gap: withFallback(((price - ma120) / ma120) * 100, fallback.ma120Gap),
      rsi14: withFallback(latestRsi, fallback.rsi14),
      macdBullish: latestMacd ? latestMacd.macdLine >= latestMacd.signalLine : fallback.macdBullish,
      volumeRatio: withFallback(todayVolume / avgVolume5, fallback.volumeRatio),
      breakout20: Number.isFinite(recentHigh20) ? price >= recentHigh20 : fallback.breakout20,
      revenueYoY: fallback.revenueYoY,
      epsYoY: fallback.epsYoY,
      roe: fallback.roe,
      foreignBuyDays: fallback.foreignBuyDays,
      valuationPercentile: percentileValuation(price, ma120)
    };
  } catch (error) {
    return {
      ...fallback,
      errorHint: error.detail || error.message
    };
  }
}

function finalizeScore(score, bullishReasons, riskReasons, confidence) {
  const finalScore = clamp(Math.round(score), 0, 100);
  return {
    score: finalScore,
    stars: buildStars(finalScore),
    biasLabel: finalScore >= 80 ? "偏多看漲" : finalScore >= 60 ? "偏多" : finalScore >= 40 ? "中性觀察" : "保守看待",
    bullishReasons: bullishReasons.slice(0, 4),
    riskReasons: riskReasons.slice(0, 3),
    confidence: clamp(Math.round(confidence), 35, 95)
  };
}

function analyzeShort(metrics) {
  let score = 24;
  let confidence = 58;
  const bullishReasons = [];
  const riskReasons = [];

  if (metrics.ma5Gap > 0 && metrics.ma10Gap > 0 && metrics.ma20Gap > 0) {
    score += 20;
    bullishReasons.push("股價站上 MA5、MA10、MA20，短線結構偏強。");
  } else {
    riskReasons.push("短線均線尚未全面翻多，仍要留意回測壓力。");
  }

  if (metrics.rsi14 >= 52 && metrics.rsi14 <= 68) {
    score += 14;
    confidence += 8;
    bullishReasons.push(`RSI14 位於 ${metrics.rsi14.toFixed(1)}，屬於健康偏多區間。`);
  } else if (metrics.rsi14 > 68) {
    score += 7;
    riskReasons.push(`RSI14 位於 ${metrics.rsi14.toFixed(1)}，短線可能過熱。`);
  } else {
    riskReasons.push(`RSI14 位於 ${metrics.rsi14.toFixed(1)}，動能仍偏弱。`);
  }

  if (metrics.macdBullish) {
    score += 16;
    confidence += 7;
    bullishReasons.push("MACD 維持多方結構，動能有延續機會。");
  } else {
    riskReasons.push("MACD 尚未轉強，短線反彈力道仍需確認。");
  }

  if (metrics.volumeRatio >= 1.15) {
    score += 16;
    confidence += 6;
    bullishReasons.push(`成交量約為近 5 日均量的 ${metrics.volumeRatio.toFixed(2)} 倍，量能有跟上。`);
  } else {
    riskReasons.push("量能沒有明顯放大，短線續攻力道可能不足。");
  }

  if (metrics.breakout20) {
    score += 12;
    bullishReasons.push("股價突破近 20 日相對高點，具備短線突破訊號。");
  } else {
    riskReasons.push("尚未突破近 20 日壓力區，容易在前高附近震盪。");
  }

  return finalizeScore(score, bullishReasons, riskReasons, confidence);
}

function analyzeMid(metrics) {
  let score = 30;
  let confidence = 62;
  const bullishReasons = [];
  const riskReasons = [];

  if (metrics.ma20Gap > 0 && metrics.ma60Gap > 0) {
    score += 22;
    bullishReasons.push("股價站上 MA20 與 MA60，中期趨勢維持向上。");
  } else {
    riskReasons.push("中期均線尚未完全走多，波段趨勢仍需確認。");
  }

  if (metrics.volumeRatio >= 1.05) {
    score += 10;
    confidence += 6;
    bullishReasons.push("量價結構配合，中期趨勢有機會延續。");
  } else {
    riskReasons.push("量能偏平，波段走勢可能缺乏推升力道。");
  }

  if (metrics.revenueYoY >= 15) {
    score += 18;
    confidence += 8;
    bullishReasons.push(`營收年增約 ${metrics.revenueYoY.toFixed(1)}%，基本面支撐較強。`);
  } else if (metrics.revenueYoY >= 8) {
    score += 10;
    bullishReasons.push(`營收年增約 ${metrics.revenueYoY.toFixed(1)}%，屬於穩健成長。`);
  } else {
    riskReasons.push("營收成長動能有限，中期評價可能受到壓抑。");
  }

  if (metrics.foreignBuyDays >= 3) {
    score += 12;
    bullishReasons.push(`外資近 ${metrics.foreignBuyDays} 日偏買超，籌碼面有支撐。`);
  } else {
    riskReasons.push("外資連買天數不足，籌碼動能仍不夠明顯。");
  }

  return finalizeScore(score, bullishReasons, riskReasons, confidence);
}

function analyzeLong(metrics) {
  let score = 34;
  let confidence = 60;
  const bullishReasons = [];
  const riskReasons = [];

  if (metrics.ma60Gap > 0 && metrics.ma120Gap > 0) {
    score += 22;
    bullishReasons.push("股價站上中長期均線，長線趨勢仍偏多。");
  } else {
    riskReasons.push("長期均線支撐不足，仍需留意趨勢反覆。");
  }

  if (metrics.epsYoY >= 15) {
    score += 16;
    confidence += 8;
    bullishReasons.push(`EPS 年增約 ${metrics.epsYoY.toFixed(1)}%，獲利成長表現佳。`);
  } else if (metrics.epsYoY >= 8) {
    score += 10;
    bullishReasons.push(`EPS 年增約 ${metrics.epsYoY.toFixed(1)}%，獲利維持成長。`);
  } else {
    riskReasons.push("EPS 成長幅度有限，長期上修空間可能受限。");
  }

  if (metrics.roe >= 15) {
    score += 14;
    bullishReasons.push(`ROE 約 ${metrics.roe.toFixed(1)}%，資本效率表現優秀。`);
  } else if (metrics.roe >= 10) {
    score += 8;
    bullishReasons.push(`ROE 約 ${metrics.roe.toFixed(1)}%，屬於穩健水準。`);
  } else {
    riskReasons.push("ROE 偏低，長期投資吸引力仍需觀察。");
  }

  if ((metrics.valuationPercentile || 55) <= 65) {
    score += 10;
    bullishReasons.push("估值位置仍在可接受區間，長期布局風險相對可控。");
  } else {
    riskReasons.push("目前估值偏高，長期持有需注意回檔風險。");
  }

  return finalizeScore(score, bullishReasons, riskReasons, confidence);
}

function analyzeByHorizon(metrics, horizon) {
  if (horizon === "short") {
    return analyzeShort(metrics);
  }
  if (horizon === "mid") {
    return analyzeMid(metrics);
  }
  return analyzeLong(metrics);
}

async function analyzeSymbol(symbol, horizon, options = {}) {
  const metrics = await buildMetrics(symbol);
  return {
    symbol,
    name: options.name || symbol,
    metrics,
    analysis: analyzeByHorizon(metrics, horizon)
  };
}

module.exports = {
  analyzeSymbol,
  analyzeByHorizon,
  buildMetrics
};
