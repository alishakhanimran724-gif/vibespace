const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ── Vision models to try in order ── */
const VISION_MODELS = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
];

/* ── Text model ── */
const TEXT_MODEL = "llama-3.3-70b-versatile";

/* ── Helper: call Groq text ── */
async function askGroq(systemPrompt, userPrompt, json = false) {
  const resp = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 1000,
    ...(json ? { response_format: { type: "json_object" } } : {}),
  });
  return resp.choices[0]?.message?.content || "";
}

/* ── Helper: try vision models in order ── */
async function askGroqVision(base64, mimeType, prompt) {
  let lastError = null;

  for (const model of VISION_MODELS) {
    try {
      console.log(`[AI] Trying vision model: ${model}`);
      const resp = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
        max_tokens: 600,
      });
      const text = resp.choices[0]?.message?.content;
      if (text) {
        console.log(`[AI] Vision success with model: ${model}`);
        return { text, model };
      }
    } catch (err) {
      console.warn(`[AI] Vision model ${model} failed: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError || new Error("All vision models failed");
}

/* ── POST /api/v1/ai/caption ── */
exports.generateCaption = async (req, res) => {
  try {
    // API key check
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "gsk_xxxxxxxxxxxxxxxx") {
      return res.status(503).json({
        success: false,
        message: "GROQ_API_KEY is not configured. Get your free key from console.groq.com"
      });
    }

    const { tab, tone, keywords, comment } = req.body;
    let result;

    if (tab === "caption") {
      const raw = await askGroq(
        `You are an expert Instagram caption writer. Write 3 engaging ${tone} captions.
         Return ONLY a JSON array of 3 strings, no explanation.`,
        `Topic/description: ${keywords}`
      );
      try { result = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
      catch { result = raw.split("\n").filter(l => l.trim()).slice(0, 3); }

    } else if (tab === "hashtags") {
      const raw = await askGroq(
        `You are a hashtag expert. Generate 20 relevant Instagram hashtags.
         Return ONLY a JSON array of 20 hashtag strings (with # prefix), no explanation.`,
        `Topic: ${keywords}`
      );
      try { result = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
      catch { result = raw.match(/#\w+/g) || []; }

    } else if (tab === "bio") {
      result = await askGroq(
        `You are an expert at writing compelling Instagram bios. Write a short, punchy bio (max 150 chars).
         Return ONLY the bio text, nothing else.`,
        `Person details: ${keywords}`
      );
      result = result.trim();

    } else if (tab === "sentiment") {
      const raw = await askGroq(
        `You are a sentiment analysis expert. Analyze the given text.
         Return ONLY a JSON object with keys:
         "sentiment" (positive/negative/neutral/mixed),
         "score" (0.0 to 1.0 confidence),
         "emotions" (array of up to 3 detected emotions like joy, anger, sadness, fear, surprise),
         "summary" (one sentence explanation)`,
        `Text to analyze: "${comment}"`,
        true
      );
      try { result = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
      catch { result = { sentiment: "neutral", score: 0.5, emotions: [], summary: raw }; }

    } else {
      return res.status(400).json({ success: false, message: "Invalid tab" });
    }

    res.json({ success: true, result });

  } catch (err) {
    console.error("AI caption error:", err.message);
    const msg = err.message?.includes("API key")
      ? "Invalid Groq API key. Check console.groq.com"
      : err.message?.includes("model")
      ? "AI model unavailable. Try again shortly."
      : "AI service error: " + err.message;
    res.status(500).json({ success: false, message: msg });
  }
};

/* ── POST /api/v1/ai/describe-image ── */
exports.describeImage = async (req, res) => {
  try {
    // API key check
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "gsk_xxxxxxxxxxxxxxxx") {
      return res.status(503).json({
        success: false,
        message: "GROQ_API_KEY is not configured. Get your free key from console.groq.com"
      });
    }

    if (!req.files?.image)
      return res.status(400).json({ success: false, message: "No image provided" });

    const fs         = require("fs");
    const fileBuffer = fs.readFileSync(req.files.image.tempFilePath);
    const base64     = fileBuffer.toString("base64");
    const mimeType   = req.files.image.mimetype;

    const prompt = `Analyze this image for an Instagram post.
Respond in this exact format:
DESCRIPTION: [2-3 sentence description of what you see]
CAPTION 1: [engaging Instagram caption]
CAPTION 2: [alternative Instagram caption]
HASHTAGS: #tag1 #tag2 #tag3 #tag4 #tag5`;

    const { text, model } = await askGroqVision(base64, mimeType, prompt);

    res.json({ success: true, description: text, model });

  } catch (err) {
    console.error("Image describe error:", err.message);

    // Specific error messages
    if (err.message?.includes("API key") || err.status === 401) {
      return res.status(401).json({
        success: false,
        message: "❌ Invalid Groq API key. Get yours free at console.groq.com"
      });
    }
    if (err.message?.includes("model") || err.status === 404) {
      return res.status(503).json({
        success: false,
        message: "❌ Vision model not available on your Groq plan. Try a paid key or check console.groq.com"
      });
    }

    res.status(500).json({
      success: false,
      message: "❌ Image analysis failed: " + err.message
    });
  }
};