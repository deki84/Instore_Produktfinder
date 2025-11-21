
import React, { useRef, useState, useCallback } from 'react';



export default function Cam(){
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Konfiguration für die Kamera (wichtig für Mobile!)
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment" | "user"    // "user" für Selfie, "environment" für Rückkamera
  };

  // Aufnehmen des Fotos
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      
      // das Bild an agent senden
      if (imageSrc) {
        sendToAIAgent(imageSrc);
      }
    }
  }, [webcamRef]);

  // Dummy-Funktion für den AI-Upload
  const sendToAIAgent = async (base64Image) => {
    console.log("Sende Bild an KI...");
    // Beispiel: Fetch an dein Backend oder direkt an OpenAI API
    // const response = await fetch('/api/analyze-image', { 
    //   method: 'POST', 
    //   body: JSON.stringify({ image: base64Image }) 
    // });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h3>KI Kamera Scanner</h3>
      
      {/* Kamera-View */}
      <div className="border-4 border-gray-800 rounded-lg overflow-hidden">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          width={500}
          mirrored={false} // True bei Selfies, False bei Objekterkennung
        />
      </div>

      {/* Auslöser Button */}
      <button 
        onClick={capture}
        className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition"
      >
        Foto aufnehmen & Analysieren
      </button>

      {/* Vorschau des aufgenommenen Bildes */}
      {imgSrc && (
        <div className="mt-4">
          <p>Letzte Aufnahme:</p>
          <img src={imgSrc} alt="Capture" className="max-w-xs rounded shadow" />
        </div>
      )}
    </div>
  );
};

