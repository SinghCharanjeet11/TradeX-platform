/**
 * Gemini Flash Service
 * Uses Google Gemini 1.5 Flash to generate AI-powered trading analysis
 */

import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

/**
 * Build the trading analysis prompt from calculated indicators
 */
function buildPrompt(indicators, symbol) {
  const rsi = indicators.rsi;
  const rsiSignal = rsi < 30 ? 'Oversold' : rsi > 70 ? 'Overbought' : 'Neutral';

  const macdVal = indicators.macd.histogram;
  const macdSignal = macdVal > 0 ? 'Bullish Crossover' : macdVal < 0 ? 'Bearish Crossover' : 'Neutral';

  const maSignal = indicators.ema12 > indicators.ema26 ? 'Price above moving average (Bullish)' : 'Price below moving average (Bearish)';

  const price = indicators.currentPrice;
  const bb = indicators.bollingerBands;
  const bbSignal = price > bb.upper ? 'Overbought - Above Upper Band' : price < bb.lower ? 'Oversold - Below Lower Band' : 'Within Normal Range';

  const sentiment = indicators.trendStrength;
  const sentimentScore = Math.round(sentiment * 10) / 10;
  const sentimentLabel = sentiment > 3 ? 'Positive' : sentiment < -3 ? 'Negative' : 'Neutral';

  const trendDirection = indicators.trendStrength > 0 ? 'Upward' : 'Downward';

  const volatility = indicators.volatility;
  const volatilityLevel = volatility > 0.05 ? 'High' : volatility > 0.02 ? 'Medium' : 'Low';

  return `You are an expert financial AI decision engine and a senior software developer.
Your job is to analyze structured market data for ${symbol} and produce a clear trading decision.

You MUST:
- Be logical, not speculative
- Avoid extreme certainty
- Base reasoning strictly on provided data

INPUT DATA:
RSI: ${rsi} (${rsiSignal})
MACD: ${macdVal} (${macdSignal})
Moving Average: ${maSignal}
Bollinger Bands: ${bbSignal}
Market Sentiment Score: ${sentimentScore} (${sentimentLabel})
Price Trend Prediction: ${trendDirection}
Volatility: ${volatilityLevel}

TASK:
1. Determine overall market condition: Bullish / Bearish / Neutral
2. Generate FINAL recommendation: BUY / SELL / HOLD
3. Assign:
   - Confidence (60–85 ONLY, never 100)
   - Risk Level (LOW / MEDIUM / HIGH)
4. Write a SHORT explanation (max 2–3 lines)

STRICT RULES:
- If signals are mixed → HOLD
- If sentiment + indicators align → BUY or SELL
- High volatility → increase risk
- Never output 100% confidence

OUTPUT FORMAT (STRICT JSON, no markdown, no extra text):
{
  "recommendation": "BUY | SELL | HOLD",
  "confidence": number,
  "risk": "LOW | MEDIUM | HIGH",
  "market_condition": "BULLISH | BEARISH | NEUTRAL",
  "explanation": "short explanation"
}`;
}

/**
 * Call Gemini Flash API with the trading prompt
 * @param {Object} indicators - Calculated technical indicators
 * @param {string} symbol - Asset symbol
 * @returns {Promise<Object>} AI analysis result
 */
export async function getGeminiSignal(indicators, symbol) {
  if (!GEMINI_API_KEY) {
    console.warn('[Gemini] No API key configured, skipping AI analysis');
    return null;
  }

  try {
    console.log(`[Gemini] Calling Gemini Flash for ${symbol}...`);

    const prompt = buildPrompt(indicators, symbol);

    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 300
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn('[Gemini] Empty response received');
      return null;
    }

    // Strip markdown code blocks if Gemini wraps the JSON
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleaned);

    // Validate the response structure
    if (!parsed.recommendation || !parsed.confidence || !parsed.risk || !parsed.market_condition) {
      console.warn('[Gemini] Invalid response structure:', parsed);
      return null;
    }

    // Clamp confidence to 60-85 as per the prompt rules
    parsed.confidence = Math.max(60, Math.min(85, parsed.confidence));

    console.log(`[Gemini] Signal for ${symbol}: ${parsed.recommendation} (${parsed.confidence}% confidence)`);

    return parsed;

  } catch (error) {
    if (error.response?.status === 429) {
      console.warn('[Gemini] Rate limit hit, falling back to rule-based signal');
    } else {
      console.error('[Gemini] Error calling Gemini Flash:', error.message);
    }
    return null;
  }
}

export default { getGeminiSignal };
