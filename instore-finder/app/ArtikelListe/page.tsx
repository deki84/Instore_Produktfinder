"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Sparkles, ScanLine, MapPin, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';





export default function ArtikelForm() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    artikelnummer: '',
    title: '',
    beschreibung: ''
  });

  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  interface ProductResult {
    Art_Nr: string;
    Art_Bezeichnung: string;
    Lagerplatz: string;
    Lagerplatz_decoded: string;
    obi_image_url?: string | null;
    Verpackung_Groesse: string | null;
    score: number;
  }

  interface ImageSearchResponse {
    caption: string;
    products: ProductResult[];
    error: string | null;
  }

  const [imageSearchResults, setImageSearchResults] = useState<ImageSearchResponse | null>(null);
  
  // Native Video Refs statt react-webcam
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
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
    // Route-ID wird nicht verwendet, aber Next.js erfordert sie aufgrund der [id] Struktur
    router.push(`/ProduktAuswahl/search?${params.toString()}`);
  };

  // KAMERA LOGIK (Native HTML5)
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Kamera Fehler:", err);
      alert("Kamera konnte nicht gestartet werden.");
      setShowCamera(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Effekt zum Starten/Stoppen der Kamera
  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera, facingMode, startCamera]);

  const capture = useCallback(async () => {
    console.log('capture clicked');

    if (!videoRef.current || !canvasRef.current) {
      console.warn('No video or canvas ref');
      return;
    }
  
    const video = videoRef.current;
    const canvas = canvasRef.current;
  
    // Ensure the video has dimensions (metadata loaded)
    if (!video.videoWidth || !video.videoHeight) {
      console.warn('Video not ready yet (no dimensions). Try again in a second.');
      return;
    }
  
    // 1) Draw current frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    const context = canvas.getContext('2d');
    if (!context) {
      console.warn('No 2D context on canvas');
      return;
    }
  
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    console.log('Frame drawn to canvas');
  
    // 2) Convert canvas to Blob
    canvas.toBlob(async (blob) => {
      console.log('toBlob callback fired, blob =', blob);
      if (!blob) {
        console.error('Blob is null – no image data');
        return;
      }
  
      try {
        stopCamera();
        setIsAnalyzing(true);
  
        // 3) Build FormData for FastAPI (UploadFile "file")
        const formDataUpload = new FormData();
        formDataUpload.append('file', blob, 'camera.jpg');
        formDataUpload.append('structured', 'true'); // Request structured data
  
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        console.log('Using API base URL:', baseUrl);
        if (!baseUrl) {
          throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
        }
  
        // 4) Call Python /image_to_prod_id with structured=true
        console.log('Sending request to', `${baseUrl}/image_to_prod_id`);
        const res = await fetch(`${baseUrl}/image_to_prod_id`, {
          method: 'POST',
          body: formDataUpload, // Content-Type must NOT be set manually
        });
  
        console.log('Response status:', res.status);
        if (!res.ok) {
          const text = await res.text();
          console.error('Backend error body:', text);
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        const data = await res.json();
        console.log("Backend JSON:", data);

        // 4) Handle structured product data from backend
        if (data.products && Array.isArray(data.products)) {
          setImageSearchResults(data);

          if (data.products.length > 0) {
            const firstProduct = data.products[0];
            setFormData((prev) => ({
              ...prev,
              artikelnummer: firstProduct.Art_Nr || "",
              beschreibung: data.caption || "",
            }));
          }

          // Success message after AI finished analysis
          setStatusMessage(
            "Die KI hat passende Artikel gefunden. Bitte einen Artikel auswählen."
          );
        } else {
          // Fallback: plain text response prod_position
          setImageSearchResults(null);
          setFormData((prev) => ({
            ...prev,
            beschreibung: data.prod_position ?? "Kein Ergebnis erhalten",
          }));
          setStatusMessage(
            "Die KI konnte keinen passenden Artikel erkennen."
          );
        }
      } catch (err) {
        console.error("Image analyze error:", err);
        alert("Fehler bei der Bildanalyse. Details in der Konsole.");
        // Error message if AI request fails
        setStatusMessage("Fehler bei der Bildanalyse. Bitte erneut versuchen.");
      } finally {
        setIsAnalyzing(false);
      }
    },
    "image/jpeg"
  );
}, [stopCamera]);
  

  // Dummy-Funktion für den KI-Agenten
  const analyzeImageWithAI = async (base64Image: string) => {
    console.log("Sende Bild an KI...", base64Image.slice(0, 50) + "...");
    
    // Simulation der Analysezeit 
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          // Als werte müssen wir dann die Antwort der KI einfügen
          artikelnummer: '47110815',
          title: 'Bosch Akku-Schrauber IXO',
          beschreibung: 'Kompakter Akkuschrauber, 3.6V, inkl. Bit-Set. Ideal für Möbelaufbau.'
        }));
        resolve();
      }, 1500);
    });
  };


  // BILD RENDERN
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-800 pb-10">
      

      <div className="bg-orange-500 pt-12 pb-8 px-6 shadow-lg rounded-b-[2.5rem]">
        <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              OBI <span className="font-normal text-orange-100">Produkt-Finder</span>
            </h1>
            <p className="text-orange-50 font-medium flex items-center gap-2">
              <Sparkles size={16} />
              KI-gestützte Artikelsuche
            </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6">
        
        {/* --- CAMERA OVERLAY --- */}
        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between animate-in fade-in duration-300">
            {/* Header im Overlay */}
            <div className="flex justify-between items-center p-6 text-white bg-gradient-to-b from-black/70 to-transparent absolute top-0 w-full z-10">
              <button onClick={toggleCamera} className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
                <RefreshCw size={20} />
              </button>
              <span className="font-bold text-lg tracking-wide">Scanner aktiv</span>
              <button onClick={stopCamera} className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-red-500/80 transition-all">
                <X size={20} />
              </button>
            </div>


            <div className="flex-grow flex items-center justify-center bg-black relative overflow-hidden">
               <video 
                 ref={videoRef}
                 autoPlay 
                 playsInline 
                 muted
                 className="w-full h-full object-cover" 
               />
               {/* Hidden Canvas for Capture */}
               <canvas ref={canvasRef} className="hidden" />
               
               {/* Scan Frame Overlay Visual */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-orange-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-orange-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-orange-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-orange-500 -mb-1 -mr-1 rounded-br-lg"></div>
                  </div>
               </div>
            </div>
            <div className="p-10 flex justify-center items-center bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full">
              <button 
                onClick={capture}
                className="w-20 h-20 rounded-full border-4 border-white bg-orange-500 hover:scale-105 hover:bg-orange-400 transition-all shadow-xl ring-4 ring-white/20"
              />
            </div>
          </div>
        )}

        {/* --- LOADING STATE --- */}
        {isAnalyzing && (
          <div className="fixed inset-0 z-40 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            <div className="text-xl font-bold text-zinc-800 animate-pulse">KI analysiert Produkt...</div>
          </div>
        )}


        <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden p-6 sm:p-8">
          <div className="mb-8">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Schnellsuche</label>
            <button 
              onClick={() => setShowCamera(true)}
              className="w-full group relative overflow-hidden rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-300 hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 p-6 text-center cursor-pointer"
            >
              <div className="flex flex-col items-center gap-3 relative z-10">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-300 ring-1 ring-zinc-100">
                  <Camera size={28} strokeWidth={2} />
                </div>
                <div>
                  <span className="block font-bold text-zinc-800 text-lg">Foto scannen</span>
                  <span className="text-sm text-zinc-500 group-hover:text-orange-600 transition-colors">Produkt oder Etikett fotografieren</span>
                </div>
              </div>
            </button>
          </div>
          <div className="relative flex items-center gap-4 mb-8">
            <div className="h-[1px] flex-1 bg-zinc-200"></div>
            <span className="text-xs font-bold text-zinc-400 uppercase">Oder manuell</span>
            <div className="h-[1px] flex-1 bg-zinc-200"></div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2 ml-1">Artikelnummer</label>
              <div className="relative">
                <input
                  type="text"
                  name="artikelnummer"
                  placeholder="z.B. 400123..."
                  className="w-full p-4 pl-4 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                  value={formData.artikelnummer}
                  onChange={handleChange}
                />
                <ScanLine size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2 ml-1">Bezeichnung</label>
              <input
                type="text"
                name="title"
                placeholder="Was suchst du?"
                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2 ml-1">Beschreibung</label>
              <textarea
                name="beschreibung"
                rows={3}
                placeholder="Zusätzliche Infos...in Natürlicher Sprache"
                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all resize-none"
                value={formData.beschreibung}
                onChange={handleChange}
              />
            </div>
          </div>

      <button 
        onClick={handleSearch}
        className="w-full bg-gray-800 text-white py-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
      >
        Artikel suchen
      </button>
    </div>

        {/* --- PRODUKTKARTEN NACH BILDAUFNAHME --- */}
        {imageSearchResults && imageSearchResults.products && imageSearchResults.products.length > 0 && (
          <div className="mt-6 bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Gefundene Produkte</h2>
              {imageSearchResults.caption && (
                <p className="text-sm text-zinc-500 italic">
                  &ldquo;{imageSearchResults.caption}&rdquo;
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {imageSearchResults.products.map((product: ProductResult, index: number) => (
                <div
                  key={product.Art_Nr || index}
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('id', product.Art_Nr);
                    router.push(`/ProduktAuswahl/search?${params.toString()}`);
                  }}
                  className="bg-zinc-50 rounded-xl border border-zinc-200 hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                >
                  <div className="flex gap-4 p-4">
                    {/* Produktbild */}
                    <div className="w-24 h-24 flex-shrink-0 bg-white rounded-lg border border-zinc-200 overflow-hidden flex items-center justify-center">                    
             {product.obi_image_url ? ( <img
           src={product.obi_image_url}
          alt={product.Art_Bezeichnung}
           className="w-full h-full object-contain"
            onError={(e) => {
             (e.target as HTMLImageElement).style.display = 'none';
             (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
           }}
          />
        ) : null}
       <div className={`${product.obi_image_url ? 'hidden' : ''} text-zinc-300`}>
        <ImageIcon size={32} />
      </div>
     </div>
                    {/* Produktinfo */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-zinc-900 mb-1 line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {product.Art_Bezeichnung}
                      </h3>
                      <p className="text-xs text-zinc-500 mb-2">
                        Art.-Nr.: {product.Art_Nr}
                      </p>
                      {product.Lagerplatz_decoded && (
                        <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
                          <MapPin size={12} />
                          <span>{product.Lagerplatz_decoded}</span>
                        </div>
                      )}
                      {product.Verpackung_Groesse && (
                        <p className="text-xs text-zinc-400">
                          {product.Verpackung_Groesse}
                        </p>
                      )}
                    </div>

                    {/* Pfeil */}
                    <div className="flex items-center">
                      <ChevronRight size={20} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setImageSearchResults(null)}
              className="mt-4 w-full text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Ergebnisse ausblenden
            </button>
          </div>
        )}

    </div>

  </div>
  );
};