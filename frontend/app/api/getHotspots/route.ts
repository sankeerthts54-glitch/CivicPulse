import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");

    const feedbackRef = collection(db, "feedback");
    let q = query(feedbackRef, where("status", "==", "classified"), limit(500));
    
    if (state && state !== "all") {
      q = query(feedbackRef, where("status", "==", "classified"), where("state", "==", state), limit(500));
    }

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
          lat: f.location?.lat || null,
          lng: f.location?.lng || null,
        };
      }
      districtMap[key].count += 1;
      districtMap[key].totalUrgency += f.urgency || 3;
      const cat = f.category || "other";
      districtMap[key].categories[cat] = (districtMap[key].categories[cat] || 0) + 1;
    });

    const hotspots = Object.values(districtMap).map((d: any) => ({
      ...d,
      avgUrgency: (d.totalUrgency / d.count).toFixed(1),
      hotspotScore: Math.round(d.count * (d.totalUrgency / d.count)),
      topCategory: Object.entries(d.categories).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "other",
    }));

    hotspots.sort((a: any, b: any) => b.hotspotScore - a.hotspotScore);

    return NextResponse.json({ hotspots: hotspots.slice(0, 50) });
  } catch (err) {
    console.error("Hotspots Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
