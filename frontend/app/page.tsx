"use client";

import { useState } from "react";
import Link from "next/link";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "bn", label: "বাংলা" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

const CATEGORIES = [
  { id: "road",       icon: "🛣️",  label: "Roads & Transport" },
  { id: "water",      icon: "💧",  label: "Water Supply" },
  { id: "power",      icon: "⚡",  label: "Electricity" },
  { id: "health",     icon: "🏥",  label: "Healthcare" },
  { id: "education",  icon: "🏫",  label: "Education" },
  { id: "sanitation", icon: "🚿",  label: "Sanitation" },
  { id: "digital",    icon: "📶",  label: "Digital Access" },
];

const STATES = [
  "Andhra Pradesh","Bihar","Chhattisgarh","Delhi","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jammu & Kashmir","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Odisha","Punjab","Rajasthan",
  "Tamil Nadu","Telangana","Uttar Pradesh","West Bengal","Assam",
];

const PLACEHOLDERS: Record<string, string> = {
  en: "Describe the infrastructure problem in your area...",
  hi: "अपने क्षेत्र की समस्या यहाँ लिखें...",
  ta: "உங்கள் பகுதியில் உள்ள சிக்கலை விவரிக்கவும்...",
  te: "మీ ప్రాంతంలో ఉన్న సమస్యను వివరించండి...",
  mr: "तुमच्या भागातील समस्या येथे लिहा...",
  bn: "আপনার এলাকার সমস্যা এখানে লিখুন...",
  kn: "ನಿಮ್ಮ ಪ್ರದೇಶದ ಸಮಸ್ಯೆಯನ್ನು ಇಲ್ಲಿ ವಿವರಿಸಿ...",
};

export default function Home() {
  const [lang, setLang]           = useState("en");
  const [category, setCategory]   = useState("");
  const [state, setState]         = useState("");
  const [district, setDistrict]   = useState("");
  const [text, setText]           = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult]       = useState<{ feedbackId: string; message: string } | null>(null);
  const [error, setError]         = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !state || !category) {
      setError("Please select a category, a state, and describe your issue.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/submitFeedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang, state, district, channel: "web" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setResult(data);
      setText(""); setCategory("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success ─────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-green-50 border-2 border-green-500 rounded-full flex items-center justify-center text-green-600 text-2xl font-bold mx-auto mb-6">✓</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Feedback Recorded</h2>
          <p className="text-gray-500 text-sm mb-4">{result.message}</p>
          <p className="font-mono text-xs bg-gray-50 border border-gray-200 text-gray-500 rounded-lg px-4 py-2 mb-6 tracking-widest">
            REF: {result.feedbackId.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Gemini AI is classifying your report. It will appear on the policymaker dashboard within minutes.
          </p>
          <button onClick={() => setResult(null)}
            className="w-full bg-[#1a3a6b] text-white font-semibold py-3 rounded-xl hover:bg-[#15305a] transition text-sm">
            Submit Another Report
          </button>
          <Link href="/dashboard" className="block mt-3 text-sm text-[#1a3a6b] hover:underline">
            View Policymaker Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Top bar — GOI-style */}
      <div className="bg-[#1a3a6b] text-white">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Ashoka emblem placeholder */}
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-lg font-black">
              🏛
            </div>
            <div>
              <p className="font-bold text-sm leading-tight tracking-wide">CivicPulse AI</p>
              <p className="text-blue-200 text-xs">Government of India — Digital Public Infrastructure</p>
            </div>
          </div>
          <Link href="/dashboard"
            className="text-xs text-blue-200 hover:text-white transition border border-blue-300/40 hover:border-white/60 px-3 py-1.5 rounded-lg">
            Policymaker Dashboard →
          </Link>
        </div>
      </div>

      {/* Orange accent strip (India flag) */}
      <div className="h-1 bg-[#e85d04]" />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Report an Infrastructure Issue
          </h1>
          <p className="text-gray-500 text-sm">
            Your report is sent directly to state and central policymakers via AI analysis.
            Write in any Indian language — Gemini handles translation automatically.
          </p>
        </div>

        {/* Language pill row */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Language / भाषा
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  lang === l.code
                    ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Issue Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition ${
                    category === cat.id
                      ? "border-[#1a3a6b] bg-[#1a3a6b]/5"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}>
                  <span className="text-xl leading-none">{cat.icon}</span>
                  <span className={`text-[11px] font-semibold text-center leading-tight ${
                    category === cat.id ? "text-[#1a3a6b]" : "text-gray-700"
                  }`}>
                    {cat.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <select value={state} onChange={(e) => setState(e.target.value)} required
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]">
                <option value="">Select State</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">District</label>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Varanasi"
                className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]" />
            </div>
          </div>

          {/* Text area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Describe the Problem <span className="text-red-500">*</span>
            </label>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDERS[lang] || PLACEHOLDERS.en}
              rows={5} required minLength={10}
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] resize-none" />
            <p className="text-xs text-gray-400 mt-1">
              You may write in {LANGUAGES.find(l => l.code === lang)?.label}. AI will translate and classify your report.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-[#1a3a6b] hover:bg-[#15305a] text-white font-semibold py-3 rounded-xl transition text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? "Submitting..." : "Submit Report →"}
          </button>

          <div className="flex justify-center gap-6 text-xs text-gray-400 pt-1">
            <span>Anonymous &amp; Secure</span>
            <span>·</span>
            <span>Powered by Gemini AI</span>
            <span>·</span>
            <span>Reaches Policymakers</span>
          </div>
        </form>
      </div>
    </div>
  );
}
