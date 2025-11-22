"use client";

import React, { useState } from 'react';
import { Heart, ChevronDown, ChevronUp, Sparkles, MapPin, ShoppingCart, Star, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Artikel {
  id: string;
  artikelnummer: string;
  titel: string;
  preis: number;
  bezeichnung: string;
  beschreibung: string;
  tag: string;
  verfuegbarkeit: string;
}

const artikelListe: Artikel[] = [
  {
    id: "1", titel: "Gaming Maus", beschreibung: "RGB Beleuchtung", preis: 59.99, tag: "Neu", bezeichnung: "Zubehör", verfuegbarkeit: "Auf Lager",
    artikelnummer: '123456'
  },
  {
    id: "2", titel: "Tastatur", beschreibung: "Mechanisch", preis: 129.90, bezeichnung: "Zubehör", tag: "Bestseller", verfuegbarkeit: "Wenige auf Lager",
    artikelnummer: '789457'
  },
  {
    id: "3", titel: "Monitor", beschreibung: "4K Auflösung", preis: 350.00, bezeichnung: "Display", tag: "Angebot", verfuegbarkeit: "Auf Lager",
    artikelnummer: '555555'
  },
];

export default function ProduktDetail() {
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const router = useRouter();

  const handleSearch = () => {
    const params = new URLSearchParams();
    // Hinweis: Hier würde normalerweise die ID des aktuellen Artikels übergeben werden
    // params.set('target', 'Sanitär'); // Beispiel
    router.push(`/MarktNavi/1?${params.toString()}`);
  };

  // für ersten Artikel eine Dummy, 
  //  artikelListe falls wirs noch .
  const produkt = artikelListe[0]; 

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-800 pb-24">
      
      {/* --- HEADER (Analog zu ArtikelForm) --- */}
      <div className="bg-orange-500 pt-12 pb-10 px-6 shadow-lg rounded-b-[2.5rem] mb-8">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Produkt <span className="font-normal text-orange-100">Details</span>
            </h1>
            <p className="text-orange-50 font-medium flex items-center gap-2">
              <Sparkles size={16} />
              OBI Markt Wetzlar
            </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-12">
        <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden p-6 sm:p-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Left Column: Image */}
            <div className="relative bg-zinc-100 border border-zinc-200 rounded-2xl aspect-[4/4] md:aspect-[3/4] flex items-center justify-center group overflow-hidden">
              <button className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur rounded-full text-zinc-400 hover:text-red-500 hover:bg-white transition-all shadow-sm z-10">
                <Heart size={20} className="group-hover:fill-red-500 transition-colors" />
              </button>
              
              {/* Placeholder Icon/Image */}
              <div className="text-zinc-300 flex flex-col items-center gap-4">
                 <div className="w-32 h-32 bg-zinc-200 rounded-full flex items-center justify-center">
                    <ShoppingCart size={48} />
                 </div>
                 <span className="text-sm font-medium uppercase tracking-widest">Produktbild</span>
              </div>

              {/* Tag Overlay */}
              <div className="absolute bottom-4 left-4">
                 <span className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase shadow-md tracking-wider">
                  {produkt.tag}
                </span>
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="flex flex-col">
              
              {/* Breadcrumb / Category */}
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-wider">
                <span>OBI</span>
                <ChevronRight size={12} />
                <span>{produkt.bezeichnung}</span>
              </div>

              <h1 className="text-3xl font-extrabold text-zinc-900 mb-2 leading-tight">{produkt.titel}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                  <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">(42 Bewertungen)</span>
              </div>

              <div className="mb-6">
                 <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                   {produkt.verfuegbarkeit}
                 </span>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-zinc-900">
                  {produkt.preis}
                </span>
                <span className="text-2xl font-bold text-zinc-500">€</span>
                <span className="text-xs text-zinc-400 ml-2 font-medium">inkl. MwSt.</span>
              </div>
              
              <p className="text-zinc-500 text-base leading-relaxed mb-8">
                {produkt.beschreibung}. Hochwertige Verarbeitung, langlebige Materialien und geprüft nach OBI Standards.
              </p>

              {/* Dropdowns */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 ml-1">Variante</label>
                  <div className="relative">
                    <select className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl appearance-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all">
                      <option>Standard</option>
                      <option>Premium</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-zinc-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 ml-1">Farbe</label>
                  <div className="relative">
                    <select className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl appearance-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all">
                      <option>Schwarz</option>
                      <option>Weiß</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-zinc-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>
              
              {/* Add to Cart (Secondary Action) */}
              <button className="w-full bg-zinc-800 text-white py-4 rounded-xl font-bold hover:bg-zinc-900 transition shadow-lg flex items-center justify-center gap-2 mb-6">
                <ShoppingCart size={20} />
                In den Warenkorb
              </button>

              {/* Accordion */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                  className="flex justify-between items-center w-full p-4 hover:bg-zinc-100 transition-colors"
                >
                  <span className="font-bold text-sm text-zinc-700">Technische Details</span>
                  {isAccordionOpen ? <ChevronUp size={18} className="text-orange-500" /> : <ChevronDown size={18} className="text-zinc-400" />}
                </button>
                
                {isAccordionOpen && (
                  <div className="p-4 pt-0 text-sm text-zinc-500 leading-relaxed border-t border-zinc-100 mt-2">
                    <p>Hier stehen detaillierte Informationen über das Produkt, Abmessungen, Materialbeschaffenheit und Pflegehinweise. Generiert durch KI.</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                        <li>Artikelnummer: {produkt.artikelnummer}</li>
                        <li>Gewicht: 1.2kg</li>
                        <li>Garantie: 2 Jahre</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating/Static Button (Primary Action: Navigation) */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-30">
        <div className="max-w-md mx-auto">
            <button 
            onClick={handleSearch}
            className="w-full bg-orange-500 text-white px-6 py-4 rounded-2xl text-lg font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 transform active:scale-[0.98]">
              <MapPin size={24} />
              Zeig mir wo ich hin muss
            </button>
        </div>
      </div>

    </div>
  );
};