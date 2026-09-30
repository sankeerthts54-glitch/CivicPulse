"use client";

import { useState } from "react";
import Link from "next/link";

// ── Constants ──────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇮🇳" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
];

const CATEGORIES = [
  { id: "road", icon: "🛣️", label: "Roads & Transport" },
  { id: "water", icon: "💧", label: "Water Supply" },
  { id: "power", icon: "⚡", label: "Electricity" },
  { id: "health", icon: "🏥", label: "Healthcare" },
  { id: "education", icon: "🏫", label: "Education" },
  { id: "sanitation", icon: "🚿", label: "Sanitation" },
  { id: "digital", icon: "📶", label: "Digital Access" },
];

const STATES = [
  "Andhra Pradesh", "Bihar", "Gujarat", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
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

const FUNCTIONS_BASE =
  process.env.NEXT_PUBLIC_FUNCTIONS_URL ||
  "https://asia-south1-civicpulse-ai.cloudfunctions.net";

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function Home() {
  const [lang, setLang] = useState("en");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    feedbackId: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !state || !category) {
      setError("Please fill in all required fields.");
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
      setText("");
      setCategory("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">
            Feedback Submitted!
          </h2>
          <p className="text-gray-600 mb-4">{result.message}</p>
          <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded p-2 mb-6">
            {result.feedbackId}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Our AI is analysing your feedback. Policymakers will see it in the
            dashboard within minutes.
          </p>
          <button
            onClick={() => setResult(null)}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition"
          >
            Submit Another
          </button>
          <Link
            href="/dashboard"
            className="block mt-3 text-sm text-indigo-600 hover:underline"
          >
            View Policymaker Dashboard →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-tight">
                CivicPulse AI
              </h1>
              <p className="text-xs text-gray-500">
                नागरिक शिकायत पोर्टल | Citizen Feedback Portal
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Policymaker Dashboard →
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Report Infrastructure Issues
          </h2>
          <p className="text-gray-600">
            Your feedback reaches national policymakers directly. Report in your
            own language — AI handles the rest.
          </p>
        </div>

        {/* Language selector */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
          <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wide">
            Select Your Language / अपनी भाषा चुनें
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  lang === l.code
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-6 space-y-5"
        >
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Category *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center p-2 rounded-xl border-2 text-xs font-medium transition ${
                    category === cat.id
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select State</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Varanasi"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Feedback text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe the Problem *
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDERS[lang] || PLACEHOLDERS.en}
              rows={4}
              required
              minLength={10}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Write in {LANGUAGES.find((l) => l.code === lang)?.label} — our AI
              will translate and classify automatically.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback →"}
          </button>

          <p className="text-xs text-center text-gray-400">
            Your submission is anonymous and goes directly to policymakers via
            AI analysis.
          </p>
        </form>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
          <span>🔒 Anonymous & Secure</span>
          <span>🤖 AI-Powered Analysis</span>
          <span>🏛️ Reaches Policymakers</span>
        </div>
      </div>
    </main>
  );
}
