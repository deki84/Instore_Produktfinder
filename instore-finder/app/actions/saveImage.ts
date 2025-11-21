'use server'

import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

export async function saveImageToServer(base64Data: string) {
  try {
    // 1. Base64 Header entfernen (data:image/jpeg;base64,)
    const base64Image = base64Data.split(';base64,').pop();
    
    if (!base64Image) {
      throw new Error('Ungültiges Bildformat');
    }

    // 2. Zielordner definieren (z.B. public/uploads im Projekt)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    // Sicherstellen, dass der Ordner existiert
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 3. Dateinamen generieren
    const filename = `scan_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // 4. Datei schreiben
    fs.writeFileSync(filepath, base64Image, { encoding: 'base64' });

    console.log(`Bild gespeichert unter: ${filepath}`);

    // Rückgabe der URL (relativ zum Public ordner)
    return { success: true, url: `/uploads/${filename}` };

  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    return { success: false, error: 'Fehler beim Speichern' };
  }
}