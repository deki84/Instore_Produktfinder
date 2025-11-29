"use client";

import React, { Suspense } from 'react';
// HINWEIS: In deiner echten Next.js App, nutze diesen Import:
// import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertTriangle, Sparkles, ChevronRight, Info } from 'lucide-react';
import {useRouter, useSearchParams} from 'next/navigation';

// --- MOCK NAVIGATION FÜR DIE VORSCHAU (BITTE IN PRODUKTION LÖSCHEN) ---
// const useRouter = () => ({
//   push: (url: string) => console.log("Navigation zu:", url),
//   back: () => console.log("Zurück")
// });
// const useSearchParams = () => ({
//   get: (key: string) => {
//     if (key === 'titel') return 'Akkuschrauber';
//     return null;
//   }
// });
// -----------------------------------------------------------------------

// Dummy-Daten für die KI-Ergebnisse
const MOCK_RESULTS = [
  {
    id: "1",
    titel: "Bosch Akku-Schrauber IXO (5. Generation)",
    bild: "https://assets.obi.de/magento/media/catalog/products/47110815/47110815_1.jpg", 
    lagerStatus: "available",
    lagerText: "Auf Lager (Gang 32)",
    kiBeschreibung: "Perfekt für den Möbelaufbau und kleine Reparaturen im Haushalt. Die KI hat diesen Artikel basierend auf deinem Bild 'Schraubenzieher' identifiziert.",
    matchScore: 98
  },
  {
    id: "2",
    titel: "Lux-Tools Bohrschrauber Set",
    bild: "https://assets.obi.de/magento/media/catalog/products/123456/123456_1.jpg",
    lagerStatus: "low",
    lagerText: "Wenige verfügbar (Gang 31)",
    kiBeschreibung: "Eine günstige Alternative. Etwas schwerer, aber mit mehr Drehmoment für härtere Materialien.",
    matchScore: 85
  },
  {
    id: "3",
    titel: "Makita Bit-Set 32-teilig",
    bild: "https://assets.obi.de/magento/media/catalog/products/987654/987654_1.jpg",
    lagerStatus: "available",
    lagerText: "Auf Lager (Kassenbereich)",
    kiBeschreibung: "Falls du nur das Zubehör suchst: Dies ist das am häufigsten gekaufte Bit-Set passend zu deiner Anfrage.",
    matchScore: 60
  }
];


function ProductSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTitle = searchParams.get('titel') || "Suchergebnisse";

  const handleSelectProduct = (id: string) => {
    // Weiterleitung zur Detailseite des gewählten Produkts
    router.push(`/detail/${id}`);
  };

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
            Wir haben <span className="text-orange-100">{MOCK_RESULTS.length} Treffer</span> gefunden
          </h1>
          <p className="text-orange-50 font-medium flex items-center gap-2 opacity-90">
            <Sparkles size={16} />
            KI-Analyse für `{queryTitle}`
          </p>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {MOCK_RESULTS.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleSelectProduct(item.id)}
              className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full group"
            >
              {/* Bild Bereich */}
              <div className="relative h-48 bg-zinc-100 flex items-center justify-center p-6 overflow-hidden">
                <div className="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles size={10} className="text-orange-400" />
                  {item.matchScore}% Match
                </div>
                {/* Fallback für Bilder */}
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-zinc-300 shadow-inner">
                    <span className="font-bold text-4xl select-none opacity-20">OBI</span>
                </div>
              </div>

              {/* Content Bereich */}
              <div className="p-6 flex flex-col flex-grow">
                
                {/* Lager Status */}
                <div className="flex items-center gap-2 mb-3">
                  {item.lagerStatus === 'available' ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                      <CheckCircle size={12} />
                      {item.lagerText}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                      <AlertTriangle size={12} />
                      {item.lagerText}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-zinc-900 leading-tight mb-3 group-hover:text-orange-500 transition-colors">
                  {item.titel}
                </h3>

                {/* KI Beschreibung */}
                <div className="bg-orange-50/50 rounded-xl p-3 mb-4 border border-orange-100/50 flex-grow">
                  <div className="flex gap-2 items-start">
                    <Info size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-zinc-600 leading-relaxed italic">
                      `{item.kiBeschreibung}`
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100">
                  <span className="text-sm font-semibold text-zinc-400">Details ansehen</span>
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>

              </div>
            </div>
          ))}

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