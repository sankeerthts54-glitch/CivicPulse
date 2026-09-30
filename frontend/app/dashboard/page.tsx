"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Hotspot {
  state: string;
  district: string;
  count: number;
  avgUrgency: string;
  hotspotScore: number;
  topCategory: string;
  lat: number | null;
  lng: number | null;
}

interface Recommendation {
  rank: number;
  state: string;
  district: string;
  category: string;
  title: string;
  urgencyLevel: string;
  hotspotScore: number;
  affectedCitizens: string;
  recommendedAction: string;
  alignedScheme: string;
  evidenceCount: number;
  sampleIssues: string[];
}

interface Stats {
  total: number;
  classified: number;
  statesCount: number;
  topState: string;
  topCategory: string;
  avgUrgency: string;
  categoryCounts: Record<string, number>;
  stateCounts: Record<string, number>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const FUNCTIONS_BASE =
  process.env.NEXT_PUBLIC_FUNCTIONS_URL ||
  "https://asia-south1-civicpulse-ai.cloudfunctions.net";

const CATEGORY_COLORS: Record<string, string> = {
  road: "#6366f1",
  water: "#3b82f6",
  power: "#f59e0b",
  health: "#ef4444",
  education: "#10b981",
  sanitation: "#8b5cf6",
  digital: "#06b6d4",
  other: "#6b7280",
};

const URGENCY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
};

const CATEGORY_ICONS: Record<string, string> = {
  road: "🛣️", water: "💧", power: "⚡", health: "🏥",
  education: "🏫", sanitation: "🚿", digital: "📶", other: "📋",
};

// ── Dashboard Page ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedState, setSelectedState] = useState("all");
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "hotspots" | "recommendations">("overview");

  useEffect(() => {
    fetchStats();
    fetchHotspots();
  }, []);

  useEffect(() => {
    fetchHotspots(selectedState);
  }, [selectedState]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/getStats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchHotspots = async (state = "all") => {
    try {
      const res = await fetch(`/api/getHotspots?state=${state}`);
      const data = await res.json();
      setHotspots(data.hotspots || []);
    } catch (err) {
      console.error("Failed to fetch hotspots:", err);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await fetch(`/api/getRecommendations`);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setActiveTab("recommendations");
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const categoryChartData = stats
    ? Object.entries(stats.categoryCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        fill: CATEGORY_COLORS[name] || "#6b7280",
      }))
    : [];

  const stateChartData = stats
    ? Object.entries(stats.stateCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name: name.split(" ")[0], value }))
    : [];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
              C
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-tight">
                CivicPulse AI
              </h1>
              <p className="text-xs text-gray-500">Policymaker Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Citizen Portal
            </Link>
            <button
              onClick={fetchRecommendations}
              disabled={loadingRecs}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loadingRecs ? "Generating..." : "🤖 Generate AI Recommendations"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 border-b-0">
            {(["overview", "hotspots", "recommendations"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Submissions", value: stats?.total ?? "—", icon: "📋", color: "indigo" },
                { label: "States Covered", value: stats?.statesCount ?? "—", icon: "🗺️", color: "blue" },
                { label: "Top State", value: stats?.topState ?? "—", icon: "📍", color: "purple" },
                { label: "Avg Urgency", value: stats ? `${stats.avgUrgency}/5` : "—", icon: "⚠️", color: "orange" },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Category breakdown */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Issues by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* State breakdown */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Submissions by State</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stateChartData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top hotspots preview */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Top Demand Hotspots</h3>
                <button
                  onClick={() => setActiveTab("hotspots")}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  View all →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium">#</th>
                      <th className="text-left py-2 text-gray-500 font-medium">District</th>
                      <th className="text-left py-2 text-gray-500 font-medium">State</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Top Issue</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Reports</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotspots.slice(0, 5).map((h, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 text-gray-400 font-mono text-xs">{i + 1}</td>
                        <td className="py-2 font-medium text-gray-900">{h.district}</td>
                        <td className="py-2 text-gray-600">{h.state}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            {CATEGORY_ICONS[h.topCategory]} {h.topCategory}
                          </span>
                        </td>
                        <td className="py-2 text-right text-gray-700">{h.count}</td>
                        <td className="py-2 text-right font-bold text-indigo-600">
                          {h.hotspotScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── HOTSPOTS TAB ── */}
        {activeTab === "hotspots" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Filter by State:</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All States</option>
                {stats &&
                  Object.keys(stats.stateCounts)
                    .sort()
                    .map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
              </select>
              <span className="text-sm text-gray-500">
                Showing {hotspots.length} districts
              </span>
            </div>

            <div className="grid gap-3">
              {hotspots.map((h, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg font-bold text-indigo-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{h.district}</span>
                      <span className="text-gray-400 text-sm">·</span>
                      <span className="text-sm text-gray-600">{h.state}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {h.count} reports · avg urgency {h.avgUrgency}/5
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700">
                        {CATEGORY_ICONS[h.topCategory]} {h.topCategory}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-indigo-600">
                      {h.hotspotScore}
                    </div>
                    <div className="text-xs text-gray-400">hotspot score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RECOMMENDATIONS TAB ── */}
        {activeTab === "recommendations" && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  No recommendations yet
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Click &quot;Generate AI Recommendations&quot; to analyse hotspot data
                  and get Gemini-powered policy suggestions.
                </p>
                <button
                  onClick={fetchRecommendations}
                  disabled={loadingRecs}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loadingRecs ? "Generating..." : "Generate Now"}
                </button>
              </div>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.rank}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                      #{rec.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-base">
                          {rec.title}
                        </h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor:
                              URGENCY_COLORS[rec.urgencyLevel] + "20",
                            color: URGENCY_COLORS[rec.urgencyLevel],
                          }}
                        >
                          {rec.urgencyLevel}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                        <span>📍 {rec.district}, {rec.state}</span>
                        <span>👥 {rec.affectedCitizens}</span>
                        <span>📊 {rec.evidenceCount} reports</span>
                        <span>🏛️ Aligns with: {rec.alignedScheme}</span>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">
                        <span className="font-medium">Recommended Action: </span>
                        {rec.recommendedAction}
                      </p>

                      {rec.sampleIssues && rec.sampleIssues.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Citizen voices:
                          </p>
                          {rec.sampleIssues.map((issue, i) => (
                            <p key={i} className="text-xs text-gray-600 italic">
                              &ldquo;{issue}&rdquo;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-indigo-600">
                        {rec.hotspotScore}
                      </div>
                      <div className="text-xs text-gray-400">score</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
