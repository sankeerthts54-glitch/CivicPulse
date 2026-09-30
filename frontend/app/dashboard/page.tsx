"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

interface Hotspot {
  state: string; district: string; count: number;
  avgUrgency: string; hotspotScore: number; topCategory: string;
  lat: number | null; lng: number | null;
}
interface Recommendation {
  rank: number; state: string; district: string; category: string;
  title: string; urgencyLevel: string; hotspotScore: number;
  affectedCitizens: string; recommendedAction: string; alignedScheme: string;
  evidenceCount: number; sampleIssues: string[];
}
interface Stats {
  total: number; classified: number; statesCount: number;
  topState: string; topCategory: string; avgUrgency: string;
  categoryCounts: Record<string, number>; stateCounts: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  road: "#4f46e5", water: "#0284c7", power: "#d97706",
  health: "#dc2626", education: "#16a34a", sanitation: "#7c3aed",
  digital: "#0891b2", other: "#6b7280",
};
const CATEGORY_ICONS: Record<string, string> = {
  road: "🛣️", water: "💧", power: "⚡", health: "🏥",
  education: "🏫", sanitation: "🚿", digital: "📶", other: "📋",
};
const URGENCY_BG: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-lg">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-gray-500">{payload[0].value} reports</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedState, setSelectedState] = useState("all");
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "hotspots" | "recommendations">("overview");

  useEffect(() => { fetchStats(); fetchHotspots(); }, []);
  useEffect(() => { fetchHotspots(selectedState); }, [selectedState]);

  const fetchStats = async () => {
    try { const r = await fetch("/api/getStats"); setStats(await r.json()); } catch {}
  };
  const fetchHotspots = async (state = "all") => {
    try { const r = await fetch(`/api/getHotspots?state=${state}`); const d = await r.json(); setHotspots(d.hotspots || []); } catch {}
  };
  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const r = await fetch("/api/getRecommendations");
      const d = await r.json();
      setRecommendations(d.recommendations || []);
      setActiveTab("recommendations");
    } catch {} finally { setLoadingRecs(false); }
  };

  const categoryChartData = stats
    ? Object.entries(stats.categoryCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1), value,
        fill: CATEGORY_COLORS[name] || "#6b7280",
      }))
    : [];
  const stateChartData = stats
    ? Object.entries(stats.stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([name, value]) => ({ name: name.split(" ")[0], value }))
    : [];

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Header */}
      <div className="bg-[#1a3a6b] text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-lg">🏛</div>
            <div>
              <p className="font-bold text-sm leading-tight tracking-wide">CivicPulse AI</p>
              <p className="text-blue-200 text-xs">Policymaker Intelligence Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-blue-200 hover:text-white transition border border-blue-300/40 hover:border-white/60 px-3 py-1.5 rounded-lg">
              ← Citizen Portal
            </Link>
            <button onClick={fetchRecommendations} disabled={loadingRecs}
              className="bg-[#e85d04] hover:bg-[#c24d03] text-white text-xs font-bold px-4 py-2 rounded-lg transition disabled:opacity-50">
              {loadingRecs ? "Generating..." : "🤖 Generate AI Recommendations"}
            </button>
          </div>
        </div>
      </div>
      <div className="h-1 bg-[#e85d04]" />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 flex gap-0">
          {(["overview", "hotspots", "recommendations"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? "border-[#1a3a6b] text-[#1a3a6b]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Submissions", value: stats?.total?.toLocaleString() ?? "—", icon: "📋", note: "citizen reports" },
                { label: "States Covered",   value: stats?.statesCount ?? "—",            icon: "🗺️", note: "across India" },
                { label: "Top State",        value: stats?.topState?.split(" ")[0] ?? "—", icon: "📍", note: "most reports" },
                { label: "Avg Urgency",      value: stats ? `${stats.avgUrgency}/5` : "—",icon: "⚠️", note: "national average" },
              ].map((c) => (
                <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="text-2xl mb-3">{c.icon}</div>
                  <div className="text-2xl font-black text-gray-900">{c.value}</div>
                  <div className="text-sm font-semibold text-gray-700 mt-0.5">{c.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.note}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-4">Issues by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {categoryChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-4">Submissions by State</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stateChartData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#374151" }} width={72} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#1a3a6b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hotspot preview table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Top Demand Hotspots</h3>
                <button onClick={() => setActiveTab("hotspots")} className="text-xs text-[#1a3a6b] font-semibold hover:underline">
                  View all →
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["#", "District", "State", "Category", "Reports", "Score"].map((h) => (
                      <th key={h} className={`px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === "Reports" || h === "Score" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {hotspots.slice(0, 5).map((h, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">{h.district}</td>
                      <td className="px-5 py-3 text-gray-600">{h.state}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {CATEGORY_ICONS[h.topCategory]} {h.topCategory}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-700">{h.count}</td>
                      <td className="px-5 py-3 text-right font-black text-[#1a3a6b]">{h.hotspotScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── HOTSPOTS ── */}
        {activeTab === "hotspots" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2 flex-wrap">
              <label className="text-sm font-semibold text-gray-700">Filter by State:</label>
              <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}
                className="bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]">
                <option value="all">All States</option>
                {stats && Object.keys(stats.stateCounts).sort().map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-sm text-gray-400">{hotspots.length} districts</span>
            </div>
            {hotspots.map((h, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-500 text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{h.district}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-600 text-sm">{h.state}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {CATEGORY_ICONS[h.topCategory]} {h.topCategory}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{h.count} reports · avg urgency {h.avgUrgency}/5</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-black text-[#1a3a6b]">{h.hotspotScore}</div>
                  <div className="text-xs text-gray-400">score</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── RECOMMENDATIONS ── */}
        {activeTab === "recommendations" && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="font-bold text-gray-900 mb-2">No recommendations yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  Click "Generate AI Recommendations" to analyse the top hotspots and get Gemini-powered policy suggestions.
                </p>
                <button onClick={fetchRecommendations} disabled={loadingRecs}
                  className="bg-[#e85d04] hover:bg-[#c24d03] text-white font-semibold px-8 py-3 rounded-xl transition disabled:opacity-50 text-sm">
                  {loadingRecs ? "Generating..." : "Generate Now"}
                </button>
              </div>
            ) : (
              recommendations.map((rec) => (
                <div key={rec.rank} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#1a3a6b] rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      #{rec.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900">{rec.title}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${URGENCY_BG[rec.urgencyLevel] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {rec.urgencyLevel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                        <span>📍 {rec.district}, {rec.state}</span>
                        <span>👥 {rec.affectedCitizens}</span>
                        <span>📊 {rec.evidenceCount} reports</span>
                        <span>🏛️ {rec.alignedScheme}</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Recommended Action: </span>
                        {rec.recommendedAction}
                      </p>
                      {rec.sampleIssues?.length > 0 && (
                        <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Citizen Reports</p>
                          {rec.sampleIssues.map((issue, i) => (
                            <p key={i} className="text-xs text-gray-600 italic">"{issue}"</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black text-[#1a3a6b]">{rec.hotspotScore}</div>
                      <div className="text-xs text-gray-400">score</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
