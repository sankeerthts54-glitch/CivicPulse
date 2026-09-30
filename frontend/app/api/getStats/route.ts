import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, "feedback"));
    const docs: any[] = [];
    snapshot.forEach((d) => docs.push(d.data()));

    const total = docs.length;
    const classified = docs.filter((d) => d.status === "classified").length;

    const stateCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    
    docs.forEach((d) => {
      if (d.state) stateCounts[d.state] = (stateCounts[d.state] || 0) + 1;
      if (d.category) categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });

    const topState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0];
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

    const avgUrgency =
      docs.filter((d) => d.urgency).reduce((sum, d) => sum + d.urgency, 0) /
      (classified || 1);

    return NextResponse.json({
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
    console.error("Stats Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
