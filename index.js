require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(bodyParser.json());
// Serve static UI files from /public
app.use(express.static(path.join(__dirname, 'public')));

app.post("/analyze", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const message = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the sentiment of the given text and respond ONLY with a JSON object containing: sentiment (positive/negative/neutral), score (-1 to 1), confidence (0-100), summary (brief description)."
        },
        {
          role: "user",
          content: `Analyze this text: "${text}"`
        }
      ],
      temperature: 0.3
    });

    const responseText = message.choices[0].message.content;
    console.log("OpenAI response:", responseText);

    let result;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      return res.status(500).json({ error: "OpenAI returned invalid JSON" });
    }

    //  Normalize response to always include required fields
    if (!result.sentiment || result.score === undefined || !result.confidence || !result.summary) {
      // fallback: derive sentiment from score
      const sentimentLabel = result.score > 0 ? "positive" : result.score < 0 ? "negative" : "neutral";
      const confidenceValue = Math.min(100, Math.max(0, Math.abs(result.score) * 100));
      const summaryText = `Positive words: ${result.positive?.join(", ") || "none"}; negative words: ${result.negative?.join(", ") || "none"}.`;

      result = {
        sentiment: sentimentLabel,
        score: result.score || 0,
        confidence: confidenceValue,
        summary: summaryText
      };
    }

    // Always return the same structure
    res.json({
      text,
      sentiment: result.sentiment,
      score: result.score,
      confidence: result.confidence,
      summary: result.summary
    });
  } catch (error) {
    console.error("Error calling OpenAI:", error.message);
    res.status(500).json({ error: "Failed to analyze sentiment: " + error.message });
  }
});


app.listen(3000, () => {
  console.log("AI Sentiment app running on http://localhost:3000");
});