import axios from "axios";
import ApiUsage from "../models/ApiUsage.js";

const BASE_URL = process.env.ASTROLOGY_API_BASE_URL;
const USER_ID = process.env.ASTROLOGY_API_USER_ID;
const API_KEY = process.env.ASTROLOGY_API_KEY;

const getAuthHeader = () => ({
  Authorization: `Basic ${Buffer.from(`${USER_ID}:${API_KEY}`).toString("base64")}`,
  "Content-Type": "application/json",
});

const call = async (endpoint, data, userId) => {
  try {
    const res = await axios.post(`${BASE_URL}/${endpoint}`, data, { headers: getAuthHeader() });
    await ApiUsage.create({ user: userId, service: "astrology", endpoint, success: true });
    return res.data;
  } catch (error) {
    await ApiUsage.create({ user: userId, service: "astrology", endpoint, success: false, errorMessage: error.message });
    throw new Error(error.response?.data?.msg || error.response?.data?.message || error.message);
  }
};

// Birth details + astro details + planets + ascendant report — all real
export const getBirthChart = async (birthDetails, userId) => {
  const [birthInfo, astroDetails, planets, ascReport, horoChart] = await Promise.all([
    call("birth_details", birthDetails, userId),
    call("astro_details", birthDetails, userId),
    call("planets", birthDetails, userId),
    call("general_ascendant_report", birthDetails, userId),
    call("horo_chart/D1", birthDetails, userId),
  ]);
  return { birthInfo, astroDetails, planets, ascReport, horoChart };
};

// Numerology report using birth date
export const getNumerology = async ({ day, month, year, name }, userId) =>
  call("numero_table", { day, month, year, name }, userId);

// Horoscope — uses GPT since sun_sign_prediction not in plan
// We use astro_details + planets for real data and pass to OpenAI for reading
export const getHoroscopeData = async (zodiacSign, birthDetails, userId) => {
  if (birthDetails?.day && birthDetails?.lat) {
    const [astroDetails, planets] = await Promise.all([
      call("astro_details", birthDetails, userId),
      call("planets", birthDetails, userId),
    ]);
    return { zodiacSign, astroDetails, planets, hasBirthDetails: true };
  }
  return { zodiacSign, hasBirthDetails: false };
};

export const getCompatibility = async (data, userId) =>
  call("match_making/ashtakoot_points", data, userId);
