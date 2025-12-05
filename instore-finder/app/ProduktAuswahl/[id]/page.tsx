"use client";

import React, { Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function ProductSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Alle Suchparameter aus der URL lesen
  const artikelnummer = searchParams.get("id") || "";
  const titel = searchParams.get("titel") || "";
  const beschreibung = searchParams.get("desc") || "";
  
  // Query-String für Backend aufbauen: Priorität: artikelnummer > titel > beschreibung
  const buildQueryText = () => {
    if (artikelnummer.trim()) return artikelnummer.trim();
    if (titel.trim()) return titel.trim();
    if (beschreibung.trim()) return beschreibung.trim();
    return "";
  };
  
  const queryText = buildQueryText();
  const displayTitle = artikelnummer || titel || beschreibung || "Suchergebnisse";

  const [resultText, setResultText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      // Keine Suche wenn kein Query vorhanden
      if (!queryText) {
        setError("Bitte geben Sie eine Artikelnummer, Bezeichnung oder Beschreibung ein.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setResultText(null);
        setImageUrl(null); 

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) {
          throw new Error("NEXT_PUBLIC_API_BASE_URL ist nicht gesetzt.");
        }

        const params = new URLSearchParams();
        params.append("text", queryText);

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
        setResultText(data.prod_position ?? JSON.stringify(data, null, 2));

        // OBI-Bild nur laden, wenn wir eine Artikelnummer haben (nicht bei Textsuche)
        if (artikelnummer.trim()) {
          try {
            const imgRes = await fetch(`${baseUrl}/obi_image/${artikelnummer.trim()}`);
            if (imgRes.ok) {
              const imgData = await imgRes.json();
              setImageUrl(imgData.imageUrl);
            }
          } catch (e) {
            console.warn("Konnte OBI-Bild nicht laden", e);
          }
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [queryText, artikelnummer]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-800 pb-10">
      {/* --- HEADER --- */}
      <div className="bg-orange-500 pt-12 pb-8 px-6 shadow-lg rounded-b-[2.5rem]">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-orange-100 hover:text-white flex items-center gap-2 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Zurück zur Suche</span>
          </button>

          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Produkt-Auswahl
          </h1>

          <p className="text-orange-50 font-medium flex items-center gap-2 opacity-90">
            <Sparkles size={16} />
            KI-Analyse für `{displayTitle}`
          </p>

          {error && (
            <p className="mt-2 text-sm bg-black/20 text-orange-50 px-3 py-1 rounded-lg">
              Fehler: {error}
            </p>
          )}
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full text-center text-sm text-zinc-400 py-10">
              Lade Ergebnis...
            </div>
          )}

          {!loading && !error && !resultText && (
            <div className="col-span-full text-center text-sm text-zinc-400 py-10">
              Kein Ergebnis gefunden.
            </div>
          )}

          {!loading && resultText && (
            <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full group">
              {/* Bild Bereich */}
              {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayTitle}
              className="w-full h-full object-contain rounded-xl"
                 />
               ) : (
  <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-zinc-300 shadow-inner">
    <span className="font-bold text-4xl select-none opacity-20">
      OBI
    </span>
  </div>
)}

              {/* Content Bereich */}
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <CheckCircle size={12} />
                    Gefundene Position
                  </div>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 leading-tight mb-3 group-hover:text-orange-500 transition-colors">
                  {displayTitle}
                </h3>

                <div className="bg-orange-50/50 rounded-xl p-3 mb-4 border border-orange-100/50 flex-grow">
                  <div className="flex gap-2 items-start">
                    <Info
                      size={16}
                      className="text-orange-400 mt-0.5 flex-shrink-0"
                    />
                    <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                      {resultText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
                  <span className="text-sm font-semibold text-zinc-400">
                    Details ansehen
                  </span>
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProduktAuswahlPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Lade Auswahl...</div>}>
      <ProductSelectionContent />
    </Suspense>
  );
}
