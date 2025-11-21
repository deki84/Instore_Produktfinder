"use client";
import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react'; // X für Schließen, Refresh für Kamera drehen
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';


const WebcamComponent = Webcam as any;

export default function ArtikelForm() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    artikelnummer: '',
    title: '',
    beschreibung: ''
  });

  // State für Kamera-Overlay
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  
  // State für Kamera-Wechsel (Front/Back)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Standard Form-Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Suche ausführen
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (formData.artikelnummer) params.set('id', formData.artikelnummer);
    if (formData.title) params.set('titel', formData.title);
    if (formData.beschreibung) params.set('desc', formData.beschreibung);
    router.push(`/ArtikelListe?${params.toString()}`);
  };

  // KAMERA LOGIK  
  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const capture = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        // Kamera schließen und Lade-Status anzeigen (optional)
        setIsAnalyzing(true);
        
        // HIER KOMMT DIE KI AGENT LOGIK HIN
        await analyzeImageWithAI(imageSrc);
        
        setShowCamera(false);
        setIsAnalyzing(false);
      }
    }
  }, [webcamRef]);

  // Dummy-Funktion für den KI-Agenten
  const analyzeImageWithAI = async (base64Image: string) => {
    console.log("Sende Bild an KI...", base64Image.slice(0, 50) + "...");
    
    // SIMULATION: Wir tun so, als hätte die KI etwas erkannt
    // In der Realität: fetch('/api/analyze', { body: ... })
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        artikelnummer: 'z.b 100058',
        title: 'Artikel Bezeichnungs',
        beschreibung: 'Ich brauche...für...'
      }));
    }, 1000);
  };


  // BILD RENDERN
  return (
    <div className="max-w-md mx-auto p-4 bg-white min-h-screen flex flex-col relative">
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          {/* Header im Overlay */}
          <div className="flex justify-between items-center p-4 text-white bg-black/50 absolute top-0 w-full z-10">
            <button onClick={toggleCamera} className="p-2 rounded-full bg-gray-800/50">
              <RefreshCw size={24} />
            </button>
            <span className="font-bold">Artikel Scannen</span>
            <button onClick={() => setShowCamera(false)} className="p-2 rounded-full bg-red-600/80">
              <X size={24} />
            </button>
          </div>

          {/* Webcam Feed */}
          <div className="flex-grow flex items-center justify-center bg-black">
             <WebcamComponent
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: facingMode
                }}
                className="w-full h-full object-cover" 
                // object-cover sorgt dafür, dass es den Screen füllt (wie am Handy gewohnt)
             />
          </div>

          {/* Auslöser Button */}
          <div className="p-8 flex justify-center bg-black/20 absolute bottom-0 w-full">
            <button 
              onClick={capture}
              className="w-20 h-20 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg"
            />
          </div>
        </div>
      )}

      
      {/* Loading State Overlay wenn KI rechnet */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-40 bg-white/80 flex items-center justify-center">
          <div className="text-xl font-bold animate-pulse">KI analysiert Bild...</div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 text-gray-800">Artikelsuche</h1>

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

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
        <textarea
          name="beschreibung"
          rows={4}
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
          value={formData.beschreibung}
          onChange={handleChange}
        />
      </div>

      {/* Kamera Button */}
      <div className="cam flex-grow flex items-center justify-center mb-8">
        <button 
          onClick={() => setShowCamera(true)}
          className="p-6 rounded-xl border-2 border-gray-800 text-gray-800 hover:bg-gray-50 transition-colors flex flex-col items-center gap-2"
        >
          <Camera size={48} strokeWidth={1.5} />
          <span className="text-sm font-medium">Foto scannen</span>
        </button>
      </div>

      <button 
        onClick={handleSearch}
        className="w-full bg-gray-800 text-white py-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
      >
        Artikel suchen
      </button>
    </div>
  );
};