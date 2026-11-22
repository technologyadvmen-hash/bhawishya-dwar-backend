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

  const isS3Url = imageUrl.startsWith('https://');
  const messageContent = isS3Url
    ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }]
    : [{ type: 'text', text: prompt + '\n\nNote: Image not accessible, provide estimated analysis based on typical palm.' }];

  const response = await getClient().chat.completions.create({
    model: MODEL(),
    messages: [{ role: 'user', content: messageContent }],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
    temperature: 0.3,
  });

  const tokensUsed = response.usage?.total_tokens || 0;
  await ApiUsage.create({ user: userId, service: 'openai', endpoint: 'palm-analysis', tokensUsed, success: true });

  const result = JSON.parse(response.choices[0].message.content);
  return { ...result, tokensUsed };
};

export const generateHoroscopeReading = async ({ zodiacSign, period, astroDetails, planets, hasBirthDetails }, language, userId) => {
  const lang = language === "hi" ? "Hindi" : "English";
  const planetInfo = planets ? planets.map(p => `${p.name}: ${p.sign} (House ${p.house}, ${p.isRetro === 'true' ? 'Retrograde' : 'Direct'})`).join('\n') : '';
  const astroInfo = astroDetails ? `Ascendant: ${astroDetails.ascendant}, Moon Sign: ${astroDetails.sign}, Nakshatra: ${astroDetails.Naksahtra}, Tithi: ${astroDetails.Tithi}, Yog: ${astroDetails.Yog}` : '';

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
  const lang = language === "hi" ? "Hindi" : "English";
  const disclaimer =
    language === "hi"
      ? "यह पारंपरिक हस्तरेखा शास्त्र पर आधारित व्याख्या है, मनोरंजन और आत्म-चिंतन के लिए। यह वैज्ञानिक भविष्यवाणी नहीं है।"
      : "This is a traditional palmistry interpretation for entertainment and self-reflection. Not a scientific prediction.";

  const prompt = `You are an expert traditional palmist. Generate a ${reportType} palmistry reading in ${lang}.

Palm Features Detected:
${JSON.stringify(features, null, 2)}

Generate a structured JSON response with these exact fields:
{
  "title": "Report title",
  "summary": "2-3 sentence summary",
  "detailedInterpretation": "Detailed paragraph",
  "positiveObservations": ["observation1", "observation2", "observation3"],
  "reflectionPoints": ["point1", "point2"],
  "sections": {
    "lifeReading": "Life line interpretation (only if detected)",
    "loveRelationships": "Heart line interpretation (only if detected)",
    "careerProfessional": "Head/fate line interpretation (only if detected)",
    "financialOutlook": "Financial palmistry interpretation",
    "personalityAnalysis": "Palm shape and mounts interpretation"
  },
  "confidenceLevel": <number 0-100 based on detected features>,
  "disclaimer": "${disclaimer}"
}

IMPORTANT: Only interpret detected features. Mark undetected features as "Not clearly visible in this scan". Never fabricate readings for undetected lines.`;

  const response = await getClient().chat.completions.create({
    model: MODEL(),
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
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
  const lang = language === "hi" ? "Hindi" : "English";
  const systemPrompt = `You are Bhawishya Dwar AI by SAVITRAM Foundation, an expert AI palmist and astrologer. Always respond in ${lang}. 
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
