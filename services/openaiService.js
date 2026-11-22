import OpenAI from "openai";
import ApiUsage from "../models/ApiUsage.js";

let _openai = null;
const getClient = () => {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
};
const MODEL = () => process.env.OPENAI_MODEL || "gpt-4o";

export const analyzePalmImage = async (imageUrl, handType, userId) => {
  const prompt = `You are an expert palmist and computer vision analyst. Carefully analyze this ${handType} hand palm image.

Detect and analyze the following palm features. Return a JSON object with EXACTLY this structure:
{
  "lifeLine": { "detected": true/false, "confidence": 0-100, "description": "brief description or null" },
  "heartLine": { "detected": true/false, "confidence": 0-100, "description": "brief description or null" },
  "headLine": { "detected": true/false, "confidence": 0-100, "description": "brief description or null" },
  "fateLine": { "detected": true/false, "confidence": 0-100, "description": "brief description or null" },
  "sunLine": { "detected": true/false, "confidence": 0-100, "description": "brief description or null" },
  "mercuryLine": { "detected": true/false, "confidence": 0-100, "description": "brief description or null" },
  "palmShape": "square" or "rectangular" or "oval" or "spatulate" or "unknown",
  "mounts": {
    "venus": "prominent/average/flat",
    "jupiter": "prominent/average/flat",
    "saturn": "prominent/average/flat",
    "apollo": "prominent/average/flat",
    "mercury": "prominent/average/flat",
    "mars": "prominent/average/flat",
    "moon": "prominent/average/flat"
  },
  "fingerProportions": {
    "index": "long/average/short",
    "middle": "long/average/short",
    "ring": "long/average/short",
    "little": "long/average/short",
    "thumb": "long/average/short"
  },
  "overallConfidence": 0-100,
  "imageQuality": 0-100
}

Be honest — if image is blurry or palm is not clearly visible, set detected: false and low confidence. Only report what you can actually see.`;

  const isValidUrl = imageUrl.startsWith("https://") || imageUrl.startsWith("data:image");
  const messageContent = isValidUrl
    ? [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageUrl, detail: "high" } }]
    : [{ type: "text", text: prompt + "\n\nNote: Image not accessible, provide estimated analysis based on typical palm." }];

  const response = await getClient().chat.completions.create({
    model: MODEL(),
    messages: [{ role: "user", content: messageContent }],
    response_format: { type: "json_object" },
    max_tokens: 1000,
    temperature: 0.3,
  });

  const tokensUsed = response.usage?.total_tokens || 0;
  await ApiUsage.create({ user: userId, service: "openai", endpoint: "palm-analysis", tokensUsed, success: true });

  const result = JSON.parse(response.choices[0].message.content);
  return { ...result, tokensUsed };
};

export const generateHoroscopeReading = async ({ zodiacSign, period, astroDetails, planets, hasBirthDetails }, language, userId) => {
  const lang = language === "hi" ? "Hindi" : "English";
  const planetInfo = planets
    ? planets.map((p) => `${p.name}: ${p.sign} (House ${p.house}, ${p.isRetro === "true" ? "Retrograde" : "Direct"})`).join("\n")
    : "";
  const astroInfo = astroDetails
    ? `Ascendant: ${astroDetails.ascendant}, Moon Sign: ${astroDetails.sign}, Nakshatra: ${astroDetails.Naksahtra}, Tithi: ${astroDetails.Tithi}, Yog: ${astroDetails.Yog}`
    : "";

  const prompt = `You are an expert Vedic astrologer. Generate a ${period} horoscope reading for ${zodiacSign} in ${lang}.

${hasBirthDetails ? `Real Planetary Data:\n${planetInfo}\n\nAstro Details:\n${astroInfo}` : `Zodiac Sign: ${zodiacSign}`}

Return JSON with exactly:
{
  "overview": "2-3 sentence ${period} overview",
  "love": "Love & relationships insight",
  "career": "Career & finance insight",
  "health": "Health & wellness insight",
  "luckyColor": "one color",
  "luckyNumber": number,
  "advice": "one line practical advice"
}`;

  const response = await getClient().chat.completions.create({
    model: MODEL(),
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 800,
  });

  const tokensUsed = response.usage?.total_tokens || 0;
  await ApiUsage.create({ user: userId, service: "openai", endpoint: "horoscope", tokensUsed, success: true });
  return { content: JSON.parse(response.choices[0].message.content), tokensUsed };
};

export const generatePalmReading = async (features, reportType, language, userId) => {
  const isHindi = language === "hi";
  const lang = isHindi ? "Hindi" : "English";

  const disclaimer = isHindi
    ? "यह पारंपरिक हस्तरेखा शास्त्र पर आधारित व्याख्या है, मनोरंजन और आत्म-चिंतन के लिए। यह वैज्ञानिक भविष्यवाणी नहीं है।"
    : "This is a traditional palmistry interpretation for entertainment and self-reflection. Not a scientific prediction.";

  const notVisible = isHindi
    ? "इस स्कैन में स्पष्ट रूप से दिखाई नहीं दे रहा"
    : "Not clearly visible in this scan";

  const featureSummary = [
    features.lifeLine?.detected
      ? `Life Line: detected, confidence ${features.lifeLine.confidence}%, ${features.lifeLine.description}`
      : "Life Line: not detected",
    features.heartLine?.detected
      ? `Heart Line: detected, confidence ${features.heartLine.confidence}%, ${features.heartLine.description}`
      : "Heart Line: not detected",
    features.headLine?.detected
      ? `Head Line: detected, confidence ${features.headLine.confidence}%, ${features.headLine.description}`
      : "Head Line: not detected",
    features.fateLine?.detected
      ? `Fate Line: detected, confidence ${features.fateLine.confidence}%, ${features.fateLine.description}`
      : "Fate Line: not detected",
    features.sunLine?.detected
      ? `Sun Line: detected, confidence ${features.sunLine.confidence}%, ${features.sunLine.description}`
      : "Sun Line: not detected",
    features.mercuryLine?.detected
      ? `Mercury Line: detected, confidence ${features.mercuryLine.confidence}%, ${features.mercuryLine.description}`
      : "Mercury Line: not detected",
    `Palm Shape: ${features.palmShape || "unknown"}`,
    features.mounts
      ? `Mounts — Venus: ${features.mounts.venus}, Jupiter: ${features.mounts.jupiter}, Saturn: ${features.mounts.saturn}, Apollo: ${features.mounts.apollo}, Mercury: ${features.mounts.mercury}, Mars: ${features.mounts.mars}, Moon: ${features.mounts.moon}`
      : "",
    features.fingerProportions
      ? `Fingers — Index: ${features.fingerProportions.index}, Middle: ${features.fingerProportions.middle}, Ring: ${features.fingerProportions.ring}, Little: ${features.fingerProportions.little}, Thumb: ${features.fingerProportions.thumb}`
      : "",
    `Overall Confidence: ${features.overallConfidence}%`,
  ]
    .filter(Boolean)
    .join("\n");

  const titlePrefix = isHindi ? "व्यक्तिगत हस्तरेखा विश्लेषण" : "Personalized Palm Reading";
  const scriptNote = isHindi
    ? "CRITICAL: Write ALL text in Hindi using Devanagari script only. Do not use any English words."
    : "Write all text in English.";

  const prompt = `You are a world-class traditional palmist and Vedic hand analyst with 30+ years of expertise. Generate a DEEP, PERSONALIZED ${reportType} palmistry reading in ${lang}.

${scriptNote}

Detected Palm Features:
${featureSummary}

Instructions:
- Write rich, detailed, personalized interpretations based ONLY on detected features
- For undetected features use exactly this phrase: "${notVisible}"
- Each section must be 3-5 sentences minimum with specific insights
- Reference actual detected line qualities, mount prominences, and finger proportions
- Provide actionable life guidance rooted in traditional palmistry

Return ONLY valid JSON with exactly these fields:
{
  "title": "${titlePrefix} — ${reportType}",
  "summary": "3-4 sentence personalized overview based on the actual detected features",
  "detailedInterpretation": "5-7 sentence holistic interpretation combining all detected lines, mounts, and palm shape",
  "positiveObservations": ["specific strength 1 from detected features", "specific strength 2", "specific strength 3", "specific strength 4"],
  "reflectionPoints": ["specific growth area 1 from detected features", "specific growth area 2", "specific growth area 3"],
  "sections": {
    "lifeReading": "Deep life line interpretation with vitality, health, and longevity insights — or use the not-visible phrase",
    "loveRelationships": "Deep heart line interpretation with emotional nature and relationship patterns — or use the not-visible phrase",
    "careerProfessional": "Deep head and fate line interpretation with career path and mental abilities — or use the not-visible phrase",
    "financialOutlook": "Financial tendencies from sun line, mercury line, and relevant mounts — or use the not-visible phrase",
    "personalityAnalysis": "Personality from palm shape, all mounts, and finger proportions — always provide this based on detected data"
  },
  "confidenceLevel": ${features.overallConfidence || 70},
  "disclaimer": "${disclaimer}"
}`;

  const response = await getClient().chat.completions.create({
    model: MODEL(),
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const tokensUsed = response.usage?.total_tokens || 0;

  await ApiUsage.create({
    user: userId,
    service: "openai",
    endpoint: "palm-reading",
    tokensUsed,
    success: true,
  });

  return {
    content: JSON.parse(response.choices[0].message.content),
    tokensUsed,
    model: MODEL(),
  };
};

export const chatWithAI = async (messages, systemContext, language, userId) => {
  const langInstruction =
    language === "hi"
      ? "IMPORTANT: You MUST respond ONLY in Hindi (Devanagari script). Do not use English at all."
      : "IMPORTANT: You MUST respond ONLY in English.";
  const systemPrompt = `You are Bhawishya Dwar AI by SAVITRAM Foundation, an expert AI palmist and Vedic astrologer. ${langInstruction}
${systemContext || ""}
Never claim certainty about future events. Present insights as traditional interpretations for self-reflection.`;

  const response = await getClient().chat.completions.create({
    model: MODEL(),
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.8,
    max_tokens: 1000,
    stream: false,
  });

  const tokensUsed = response.usage?.total_tokens || 0;

  await ApiUsage.create({
    user: userId,
    service: "openai",
    endpoint: "chat",
    tokensUsed,
    success: true,
  });

  return {
    content: response.choices[0].message.content,
    tokensUsed,
  };
};
