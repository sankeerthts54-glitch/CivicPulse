import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

export async function GET() {
  try {
    const feedbackRef = collection(db, "feedback");
    const q = query(feedbackRef, where("status", "==", "classified"), limit(500));
    const snapshot = await getDocs(q);
    const feedback: any[] = [];
    snapshot.forEach((doc) => feedback.push(doc.data()));

    const districtMap: Record<string, any> = {};
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
      districtMap[key].categories[cat] = (districtMap[key].categories[cat] || 0) + 1;
      if (f.summary && districtMap[key].summaries.length < 3) {
        districtMap[key].summaries.push(f.summary);
      }
    });

    const hotspots = Object.values(districtMap)
      .map((d: any) => ({
        ...d,
        hotspotScore: Math.round(d.count * (d.totalUrgency / d.count)),
        topCategory: Object.entries(d.categories).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "other",
      }))
      .sort((a: any, b: any) => b.hotspotScore - a.hotspotScore)
      .slice(0, 5);

    if (hotspots.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const prompt = `You are an Indian infrastructure policy advisor. Based on these citizen feedback hotspots, generate 3-5 specific, actionable infrastructure recommendations for policymakers.

Top Hotspot Data:
${JSON.stringify(hotspots, null, 2)}

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
    const jsonStr = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const recommendations = JSON.parse(jsonStr);

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("Recommendations Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
