'use server'

// Bitte eure API in die .env Datei eintragen damit ich damit kommunizieren kann.
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

export default async function analyzeProductWithAI(formData: FormData) {
  try {
    const imageFile = formData.get('image') as string; // Base64 String
    const textInput = formData.get('text') as string;
    
    let endpoint = '';
    const payload = {};
    const headers = {};

    // Entscheidung: Bild oder Text?
    if (imageFile) {
      endpoint = '/image_to_prod_id';
      
      // Wenn ich mich richtig erinnere, erwartet euer Python Script entweder einen Base64 String
      // oder wir senden es einfach als Form-Data weiter, je nachdem wie euer Python Script es erwartet.
      // Hier gehe ich davon aus, dass euer Python Endpoint 'file' als Form-Data erwartet. Da ich und Auroa das ganz am anfang darauf geeinigt hatten
      // Da wir in dieser datei im Server Action Kontext sind, ist es oft einfacher, JSON zu senden.
      
      const cleanBase64 = imageFile.split(';base64,').pop();
      if (!cleanBase64) throw new Error("Bilddaten fehlerhaft");
      
      // In einer echten Implementierung würde man hier fetch mit FormData nutzen.
      // Da FastAPI 'UploadFile' erwartet, ist der Forwarding-Code etwas komplexer in Node.
      // VEREINFACHUNG: Wir senden den Pfad oder Base64, je nachdem was dein Python Script unterstützt.
      // Ich passe es an dein 'fastapi_image2text_main.py' an, das scheinbar einen Pfad oder File erwartet.
      
      // Da wir das bild derzeit noch lokal in Uploads speichern, schick ich nur den Pfad an Python.
      const savedFilePath = formData.get('filePath') as string;
      
      // FormData für den Python Request bauen
      const pythonFormData = new FormData();
      pythonFormData.append('file', savedFilePath); // Achtung: Dein Python Skript erwartet hier den Pfad als String im 'file' Feld?
      
      // WICHTIG: Dein Python Script `answer_from_image` nimmt einen Pfad.
      // Dein FastAPI `image_to_prod_id` nimmt `file: str = Form(...)`.
      // Also senden wir es als Form URL Encoded oder Multipart.
      
      const params_img_to_ai = new URLSearchParams();
      params_img_to_ai.append('file', savedFilePath); // Wir senden den lokalen Pfad

      const response = await fetch(`${PYTHON_API_URL}/image_to_prod_id`, {
        method: 'POST',
        body: params_img_to_ai,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // 'Content-Type': 'application/json' // einfach wieder einkommentieren um Explizit als JSON senden
        },
      });
      
      if (!response.ok) throw new Error(`Python API Error: ${response.statusText}`);
      return await response.json();

    } else if (textInput) {
      endpoint = '/text_to_prod_id';
      
      const params_txt_to_ai = new URLSearchParams();
      params_txt_to_ai.append('text', textInput);

      const response = await fetch(`${PYTHON_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
            // 'Content-Type': 'application/json' // einfach wieder einkommentieren um Explizit als JSON senden
        },
        body: params_txt_to_ai
      });

      if (!response.ok) throw new Error(`Python API Error: ${response.statusText}`);
      return await response.json();
    }

    return { error: "Keine Eingabe vorhanden" };

  } catch (error) {
    console.error("AI Bridge Error:", error);
    // Fallback Daten für Demo für meine Demo da der Python Service noch nicht verbunden ist.
    return { 
      success: false, 
      fallbackData: [
        { id: "1", title: "Bosch Akkuschrauber (Fallback)", score: 0.95 },
        { id: "2", title: "Schraubenzieher Set", score: 0.80 }
      ]
    };
  }
}