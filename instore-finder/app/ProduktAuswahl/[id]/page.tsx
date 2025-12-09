"use client";

import React, { Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function ProductSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read ALL search parameters from URL
  const artikelnummer = searchParams.get("id") || "";
  const titel = searchParams.get("titel") || "";
  const beschreibung = searchParams.get("desc") || "";

  // Build query for backend: Priority → article number > title > description
  const buildQueryText = () => {
    if (artikelnummer.trim()) return artikelnummer.trim();
    if (titel.trim()) return titel.trim();
    if (beschreibung.trim()) return beschreibung.trim();
    return "";
  };

  const queryText = buildQueryText();
  const displayTitle =
    artikelnummer || titel || beschreibung || "Search Results";

  const [resultText, setResultText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const cleanedResultText =
  resultText
    ?.split("\n")
    .filter(line => !line.trim().toLowerCase().startsWith("bild-url:"))
    .join("\n")
    .trim() ?? null;
  

  useEffect(() => {
    const fetchResult = async () => {
      // No query → do not call backend
      if (!queryText) {
        setError("Please enter an article number, name, or description.");
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
          throw new Error("NEXT_PUBLIC_API_BASE_URL is not set.");
        }

        // Build POST body
        const params = new URLSearchParams();
        params.append("text", queryText);

        // Ask backend for product position
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

        // Backend returns { prod_position: "..." }
        setResultText(data.prod_position ?? JSON.stringify(data, null, 2));

        // Load OBI image only when article number is present
        if (artikelnummer.trim()) {
          try {
            const imgRes = await fetch(`${baseUrl}/obi_image/${artikelnummer.trim()}`);
            if (imgRes.ok) {
              const imgData = await imgRes.json();
              setImageUrl(imgData.imageUrl);
            }
          } catch (e) {
            console.warn("Could not load OBI image", e);
          }
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [queryText, artikelnummer]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-800 flex items-start justify-center py-10 w-full">
      {/* ZENTRIERTER APP-CONTAINER */}
      <div className="flex flex-col mx-auto" style={{ width: '369px', maxWidth: '369px' }}>
        {/* HEADER SECTION */}
        <div className="bg-orange-500 pt-12 pb-8 px-4 sm:px-6 shadow-lg rounded-b-[2.5rem] w-full" style={{ width: '369px', maxWidth: '369px' }}>
          <div className="w-full">
            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="text-orange-100 hover:text-white flex items-center gap-2 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Search</span>
            </button>

            {/* Title */}
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Product Selection
            </h1>

            <p className="text-orange-50 font-medium flex items-center gap-2 opacity-90">
              <Sparkles size={16} />
              AI Analysis for `{displayTitle}`
            </p>

            {/* Error message */}
            {error && (
              <p className="mt-2 text-sm bg-black/20 text-orange-50 px-3 py-1 rounded-lg">
                Error: {error}
              </p>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="-mt-6 w-full">
          <div className="flex flex-col gap-6">
            {/* Loading indicator */}
            {loading && (
              <div className="text-center text-sm text-zinc-400 py-10">
                Loading results...
              </div>
            )}

            {/* No results */}
            {!loading && !error && !resultText && (
              <div className="text-center text-sm text-zinc-400 py-10">
                No results found.
              </div>
            )}

            {/* Result Card */}
            {!loading && resultText && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-zinc-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group mx-auto"
                   style={{ width: '369px' }}>
                {/* IMAGE SECTION */}
                <div className="w-full aspect-[4/3] bg-zinc-50 rounded-t-2xl sm:rounded-t-3xl overflow-hidden flex items-center justify-center flex-shrink-0">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={displayTitle}
                      width={400}
                      height={300}
                      className="object-contain w-full h-full p-4"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center text-zinc-300">
                      <span className="font-bold text-4xl select-none opacity-20">
                        OBI
                      </span>
                    </div>
                  )}
                </div>

                {/* TEXT SECTION */}
                <div className="p-4 sm:p-6 flex flex-col flex-grow">
                  {/* Position badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg">
                      <CheckCircle size={14} />
                      Position gefunden
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight mb-4 group-hover:text-orange-500 transition-colors">
                    {displayTitle}
                  </h3>

                  {/* Result description */}
                  <div className="bg-orange-50/50 rounded-xl p-4 mb-4 border border-orange-100/50 flex-grow">
                    <div className="flex gap-3 items-start">
                      <Info
                        size={18}
                        className="text-orange-500 mt-0.5 flex-shrink-0"
                      />
                      <p className="text-sm sm:text-base text-zinc-700 leading-relaxed whitespace-pre-wrap">
                        {cleanedResultText ?? resultText}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProduktAuswahlPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ProductSelectionContent />
    </Suspense>
  );
}