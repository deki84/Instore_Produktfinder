"use client";
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useRouter } from 'next/navigation'; 

export default function ArtikelForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    artikelnummer: '',
    title: '',
    beschreibung: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    // Wir bauen Query-Parameter (z.B. ?titel=Hammer&id=123)
    const params = new URLSearchParams();
    
    if (formData.artikelnummer) params.set('id', formData.artikelnummer);
    if (formData.title) params.set('titel', formData.title);
    if (formData.beschreibung) params.set('desc', formData.beschreibung);

    // Wir navigieren zur LISTE, nicht zur Detailseite
    router.push(`/ArtikelListe?${params.toString()}`);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen flex flex-col">
      
      {/* Input: Artikelnummer */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Artikelnummer</label>
        <input
          type="text"
          name="artikelnummer"
          placeholder="z.B. 100458"
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          value={formData.artikelnummer}
          onChange={handleChange}
        />
      </div>

      {/* Input: Artikelbezeichnung (Bugfix: name="title" statt "artikelbeschreibung") */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Artikelbezeichnung</label>
        <input
          type="text"
          name="title" 
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
          value={formData.title}
          onChange={handleChange}
        />
      </div>

      {/* Textarea: Beschreibung */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
        <textarea
          name="desc"
          rows={4}
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
          value={formData.beschreibung}
          onChange={handleChange}
        />
      </div>

      <div className="flex-grow flex items-center justify-center mb-8">
        <button className="p-6 rounded-xl border-2 border-gray-800 text-gray-800 hover:bg-gray-50 transition-colors">
          <Camera size={48} strokeWidth={1.5} />
        </button>
      </div>

      {/* Button ruft jetzt handleSearch auf */}
      <button 
        onClick={handleSearch}
        className="w-full bg-gray-800 text-white py-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
      >
        Artikel suchen
      </button>
    </div>
  );
};