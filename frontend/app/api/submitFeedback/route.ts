import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Translate } from "@google-cloud/translate/build/src/v2";
import { v4 as uuidv4 } from "uuid";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

// Translation client initialization (optional for MVP if keys are tricky to set up on Vercel)
// If translation fails, we fallback to just passing the raw text to Gemini.
let translate: Translate | null = null;
try {
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });
  }
} catch (e) {
  console.warn("Translation API not configured properly.");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      text,
      language = "en",
      state = "Unknown",
      district = "Unknown",
      lat = null,
      lng = null,
      channel = "web",
    } = body;

    if (!text || text.trim().length < 5) {
      return NextResponse.json({ error: "Feedback text too short" }, { status: 400 });
    }

    const feedbackId = uuidv4();
    let translatedText = text;

    // 1. Translate if not English
    if (language !== "en" && translate) {
      try {
        const [translation] = await translate.translate(text, "en");
        translatedText = translation;
      } catch (e) {
        console.error("Translation error", e);
      }
    }

    // 2. Classify synchronously with Gemini
    let classification = {
      category: "other",
      urgency: 3,
      sentiment: "neutral",
      summary: translatedText.slice(0, 100),
      infrastructureType: "unknown",
    };

    const prompt = `You are a civic infrastructure analyst for India. Analyze this citizen feedback and return ONLY valid JSON with no markdown.

Feedback: "${translatedText}"
State: ${state}
District: ${district}

Return this exact JSON structure:
{
  "category": "<one of: road, water, power, health, education, sanitation, digital, other>",
  "urgency": <integer 1-5, where 5 is most critical>,
  "sentiment": "<positive|neutral|negative>",
  "summary": "<one concise English sentence summarizing the issue>",
  "infrastructureType": "<specific infrastructure mentioned>"
}`;

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const jsonStr = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      classification = JSON.parse(jsonStr);
    } catch (err) {
      console.error("Gemini classification error:", err);
    }

    // 3. Save to Firestore
    const docRef = doc(db, "feedback", feedbackId);
    await setDoc(docRef, {
      feedbackId,
      rawText: text,
      translatedText,
      language,
      state,
      district,
      location: lat && lng ? { lat, lng } : null,
      channel,
      status: "classified",
      createdAt: serverTimestamp(),
      classifiedAt: serverTimestamp(),
      ...classification,
    });

    const confirmations: Record<string, string> = {
      hi: "आपकी शिकायत दर्ज की गई है।",
      en: "Your feedback has been recorded.",
    };
    const confirmMsg = confirmations[language] || confirmations["en"];

    return NextResponse.json({
      feedbackId,
      message: `${confirmMsg} ID: ${feedbackId.slice(0, 8).toUpperCase()}`,
    }, { status: 201 });

  } catch (err) {
    console.error("Submit API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
