const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Translate } = require("@google-cloud/translate").v2;
const cors = require("cors")({ origin: true });
const { v4: uuidv4 } = require("uuid");

admin.initializeApp();
const db = admin.firestore();

// ─── Gemini Client ────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ─── Translation Client ───────────────────────────────────────────────────────
const translate = new Translate();

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUBMIT FEEDBACK  →  POST /submitFeedback
//    Accepts: { text, language, state, district, lat, lng, channel, category }
//    Returns: { feedbackId, message }
// ─────────────────────────────────────────────────────────────────────────────
exports.submitFeedback = onRequest(
  { region: "asia-south1", secrets: ["GEMINI_API_KEY"] },
  async (req, res) => {
    cors(req, res, async () => {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const {
        text,
        language = "en",
        state = "Unknown",
        district = "Unknown",
        lat = null,
        lng = null,
        channel = "web",
      } = req.body;

      if (!text || text.trim().length < 5) {
        return res.status(400).json({ error: "Feedback text too short" });
      }

      try {
        const feedbackId = uuidv4();

        // Step 1: Translate to English if not already
        let translatedText = text;
        if (language !== "en") {
          const [translation] = await translate.translate(text, "en");
          translatedText = translation;
        }

        // Step 2: Save raw feedback to Firestore immediately
        await db.collection("feedback").doc(feedbackId).set({
          feedbackId,
          rawText: text,
          translatedText,
          language,
          state,
          district,
          location: lat && lng ? new admin.firestore.GeoPoint(lat, lng) : null,
          channel,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          // Classification fields — filled by onDocumentCreated trigger
          category: null,
          urgency: null,
          sentiment: null,
          summary: null,
          infrastructureType: null,
        });

        // Respond immediately with confirmation (classification happens async)
        const confirmations = {
          hi: "आपकी शिकायत दर्ज की गई है। ट्रैकिंग ID:",
          ta: "உங்கள் புகார் பதிவு செய்யப்பட்டது. கண்காணிப்பு ID:",
          te: "మీ ఫిర్యాదు నమోదు చేయబడింది. ట్రాకింగ్ ID:",
          mr: "तुमची तक్रार नोंदवली गेली. ट्रॅकिंग ID:",
          bn: "আপনার অভিযোগ নথিভুক্ত হয়েছে। ট্র্যাকিং ID:",
          kn: "ನಿಮ್ಮ ದೂರನ್ನು ನೋಂದಾಯಿಸಲಾಗಿದೆ. ಟ್ರ್ಯಾಕಿಂಗ್ ID:",
          en: "Your feedback has been recorded. Tracking ID:",
        };
        const confirmMsg =
          confirmations[language] || confirmations["en"];

        return res.status(201).json({
          feedbackId,
          message: `${confirmMsg} ${feedbackId.slice(0, 8).toUpperCase()}`,
        });
      } catch (err) {
        console.error("submitFeedback error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. GEMINI CLASSIFICATION TRIGGER
//    Fires automatically when a new feedback doc is created in Firestore
//    Updates the doc with: category, urgency, sentiment, summary
// ─────────────────────────────────────────────────────────────────────────────
exports.classifyFeedback = onDocumentCreated(
  { document: "feedback/{feedbackId}", secrets: ["GEMINI_API_KEY"] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    if (data.status !== "pending") return; // already processed

    const { translatedText, state, district } = data;

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
  "infrastructureType": "<specific infrastructure mentioned, e.g. pothole, pipeline, transformer>",
  "affectedScale": "<individual|locality|ward|district|state>"
}`;

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      // Strip markdown code fences if Gemini adds them
      const jsonStr = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      const classification = JSON.parse(jsonStr);

      await snap.ref.update({
        ...classification,
        status: "classified",
        classifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Classified feedback ${data.feedbackId}: ${classification.category} (urgency: ${classification.urgency})`);
    } catch (err) {
      console.error("classifyFeedback error:", err);
      await snap.ref.update({ status: "error", errorMsg: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET HOTSPOTS  →  GET /getHotspots?state=Maharashtra
//    Returns aggregated hotspot data for the dashboard map
// ─────────────────────────────────────────────────────────────────────────────
exports.getHotspots = onRequest(
  { region: "asia-south1" },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        const { state } = req.query;
        let query = db
          .collection("feedback")
          .where("status", "==", "classified");

        if (state && state !== "all") {
          query = query.where("state", "==", state);
        }

        const snapshot = await query.limit(500).get();
        const feedback = [];
        snapshot.forEach((doc) => feedback.push(doc.data()));

        // Aggregate by district
        const districtMap = {};
        feedback.forEach((f) => {
          const key = `${f.state}__${f.district}`;
          if (!districtMap[key]) {
            districtMap[key] = {
              state: f.state,
              district: f.district,
              count: 0,
              totalUrgency: 0,
              categories: {},
              lat: f.location ? f.location._latitude : null,
              lng: f.location ? f.location._longitude : null,
            };
          }
          districtMap[key].count += 1;
          districtMap[key].totalUrgency += f.urgency || 3;
          const cat = f.category || "other";
          districtMap[key].categories[cat] =
            (districtMap[key].categories[cat] || 0) + 1;
        });

        // Calculate hotspot score and top category
        const hotspots = Object.values(districtMap).map((d) => ({
          ...d,
          avgUrgency: (d.totalUrgency / d.count).toFixed(1),
          hotspotScore: Math.round(d.count * (d.totalUrgency / d.count)),
          topCategory: Object.entries(d.categories).sort(
            (a, b) => b[1] - a[1]
          )[0]?.[0],
        }));

        // Sort by hotspot score
        hotspots.sort((a, b) => b.hotspotScore - a.hotspotScore);

        return res.json({ hotspots: hotspots.slice(0, 50) });
      } catch (err) {
        console.error("getHotspots error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET AI RECOMMENDATIONS  →  GET /getRecommendations
//    Calls Gemini with top hotspot data and returns ranked recommendations
// ─────────────────────────────────────────────────────────────────────────────
exports.getRecommendations = onRequest(
  { region: "asia-south1", secrets: ["GEMINI_API_KEY"], timeoutSeconds: 60 },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        // Get top 10 hotspots
        const snapshot = await db
          .collection("feedback")
          .where("status", "==", "classified")
          .limit(500)
          .get();

        const feedback = [];
        snapshot.forEach((doc) => feedback.push(doc.data()));

        // Aggregate (same logic as getHotspots)
        const districtMap = {};
        feedback.forEach((f) => {
          const key = `${f.state}__${f.district}`;
          if (!districtMap[key]) {
            districtMap[key] = {
              state: f.state,
              district: f.district,
              count: 0,
              totalUrgency: 0,
              categories: {},
              summaries: [],
            };
          }
          districtMap[key].count += 1;
          districtMap[key].totalUrgency += f.urgency || 3;
          const cat = f.category || "other";
          districtMap[key].categories[cat] =
            (districtMap[key].categories[cat] || 0) + 1;
          if (f.summary && districtMap[key].summaries.length < 3) {
            districtMap[key].summaries.push(f.summary);
          }
        });

        const hotspots = Object.values(districtMap)
          .map((d) => ({
            ...d,
            hotspotScore: Math.round(
              d.count * (d.totalUrgency / d.count)
            ),
            topCategory: Object.entries(d.categories).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0],
          }))
          .sort((a, b) => b.hotspotScore - a.hotspotScore)
          .slice(0, 5);

        if (hotspots.length === 0) {
          return res.json({ recommendations: [] });
        }

        const hotspotsJson = JSON.stringify(hotspots, null, 2);

        const prompt = `You are an Indian infrastructure policy advisor. Based on these citizen feedback hotspots, generate 3-5 specific, actionable infrastructure recommendations for policymakers.

Top Hotspot Data:
${hotspotsJson}

Return ONLY a valid JSON array with no markdown. Each item must have:
{
  "rank": <number>,
  "state": "<state name>",
  "district": "<district name>",
  "category": "<infrastructure category>",
  "title": "<specific project title>",
  "urgencyLevel": "<Critical|High|Medium>",
  "hotspotScore": <number>,
  "affectedCitizens": "<estimated number, e.g. ~2.3 lakh>",
  "recommendedAction": "<specific 1-2 sentence action>",
  "alignedScheme": "<matching central/state govt scheme, e.g. Jal Jeevan Mission>",
  "evidenceCount": <number of feedback records>,
  "sampleIssues": ["<issue 1>", "<issue 2>"]
}`;

        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        const jsonStr = raw
          .replace(/^```json\n?/, "")
          .replace(/\n?```$/, "");
        const recommendations = JSON.parse(jsonStr);

        return res.json({ recommendations });
      } catch (err) {
        console.error("getRecommendations error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET STATS  →  GET /getStats
//    Summary statistics for the dashboard overview cards
// ─────────────────────────────────────────────────────────────────────────────
exports.getStats = onRequest(
  { region: "asia-south1" },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        const snapshot = await db.collection("feedback").get();
        const docs = [];
        snapshot.forEach((d) => docs.push(d.data()));

        const total = docs.length;
        const classified = docs.filter(
          (d) => d.status === "classified"
        ).length;

        const stateCounts = {};
        const categoryCounts = {};
        docs.forEach((d) => {
          if (d.state) stateCounts[d.state] = (stateCounts[d.state] || 0) + 1;
          if (d.category)
            categoryCounts[d.category] =
              (categoryCounts[d.category] || 0) + 1;
        });

        const topState = Object.entries(stateCounts).sort(
          (a, b) => b[1] - a[1]
        )[0];
        const topCategory = Object.entries(categoryCounts).sort(
          (a, b) => b[1] - a[1]
        )[0];

        const avgUrgency =
          docs
            .filter((d) => d.urgency)
            .reduce((sum, d) => sum + d.urgency, 0) /
            (classified || 1);

        return res.json({
          total,
          classified,
          statesCount: Object.keys(stateCounts).length,
          topState: topState ? topState[0] : "N/A",
          topCategory: topCategory ? topCategory[0] : "N/A",
          avgUrgency: avgUrgency.toFixed(1),
          categoryCounts,
          stateCounts,
        });
      } catch (err) {
        console.error("getStats error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  }
);
