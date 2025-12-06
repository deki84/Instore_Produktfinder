"use client";

import { useState } from "react";

export default function TestSuchePage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) {
        setError("NEXT_PUBLIC_API_BASE_URL ist nicht gesetzt.");
        return;
      }

      const params = new URLSearchParams();
      params.append("text", query);

      const res = await fetch(`${baseUrl}/text_to_prod_id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();

      // Backend gibt { prod_position: "..." } zurück
      setResult(data.prod_position ?? JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white shadow-lg rounded-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold mb-2">Produktsuche</h1>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Artikelbeschreibung oder Artikelnummer eingeben..."
          className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
        />

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 py-3 rounded-lg bg-orange-500 text-white text-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Suche..." : "Suche starten"}
        </button>

        {error && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg p-3">
            Fehler: {error}
          </div>
        )}

        {result && (
          <pre className="text-sm bg-zinc-900 text-zinc-100 rounded-lg p-3 overflow-x-auto max-h-64 whitespace-pre-wrap">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}