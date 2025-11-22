"use client";

import React, { useState } from 'react';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
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
    router.push(`/MarktNavi/[id]?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* Left Column: Image */}
        <div className="relative bg-gray-200 rounded-lg aspect-[3/4] flex items-center justify-center">
          <button className="absolute top-4 left-4 p-2 bg-black/70 rounded-full text-white hover:bg-black transition">
            <Heart size={18} fill="white" />
          </button>
          <div className="text-gray-400 text-4xl">

          </div>
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col">
          {}
          <h1 className="text-2xl font-bold mb-2">{}</h1>
          
          <div className="mb-2">
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold uppercase">
              Tag
            </span>
          </div>

          <div className="text-4xl font-bold mb-2">
            <span className="text-sm align-top">€</span>50
          </div>
          
          <p className="text-gray-500 text-sm mb-6">Text</p>

          {/* Dropdowns */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Größe</label>
              <div className="relative">
                <select className="w-full p-2 border border-gray-200 rounded appearance-none bg-white text-sm">
                  <option>Value</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Farbe</label>
              <div className="relative">
                <select className="w-full p-2 border border-gray-200 rounded appearance-none bg-white text-sm">
                  <option>Value</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
          
          <button className="w-full bg-gray-800 text-white py-3 rounded mb-6 hover:bg-gray-700 transition">
            Button
          </button>

          {/* Accordion */}
          <div className="border border-gray-200 rounded-lg p-4">
            <button 
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              className="flex justify-between items-center w-full mb-2"
            >
              <span className="font-bold text-sm">Title</span>
              {isAccordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {isAccordionOpen && (
              <p className="text-sm text-gray-600 leading-relaxed">
                Beschreibung LLM 
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Floating/Static Button */}
      <div className="flex justify-center">
        <button 
        onClick={handleSearch}
        className="bg-gray-800 text-white px-8 py-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition shadow-lg">
          Zeig mir wo ich hin muss
        </button>
      </div>
    </div>
  );
};