# backend/image_to_text_ionos.py

import os
import base64
import mimetypes
import requests
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

OPENAI_API_TOKEN = os.getenv("OPENAI_API_TOKEN")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL","https://api.openai.com/v1")  # e.g. https://api.openai.com/v1
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() == "true"

if not OPENAI_API_TOKEN:
    raise RuntimeError("OPENAI_API_TOKEN is not set in .env")


def file_to_data_uri(path: str) -> str:
    """
    Convert a local image file into a data: URI that can be sent to the API.
    """
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def image_to_text(image_path: str, structured: bool = False) -> str | dict:
    """
    Takes an image path, encodes the image and calls the IONOS model.
    Returns a short German description of the image, or structured JSON if structured=True.
    """
    data_uri = file_to_data_uri(image_path)

    if structured:
        # Request structured JSON output
        messages = [
            {
                "role": "system",
                "content": (
                    "Du bist ein Assistent für einen Baumarkt-Produktfinder. "
                    "Analysiere das Bild und beschreibe NUR die Produkte, die du siehst. "
                    "Fokussiere dich auf das, was im Vordergrund ist - das ist normalerweise das Hauptprodukt. "
                    "Ignoriere Hintergrund-Elemente wie Personen, Wände oder andere nicht relevante Objekte. "
                    "Gib deine Antwort als JSON-Objekt zurück mit folgenden Feldern: "
                    "produktname (string), typ (string), material (string), farbe (string), "
                    "groesse (string), form (string), behaelter (string, falls vorhanden), "
                    "wichtige_merkmale (string). "
                    "Wenn keine Produkte im Bild sind, setze produktname auf 'Kein Produkt erkannt'. "
                    "Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Beschreibe nur das Produkt im Vordergrund. Analysiere die Produkte in diesem Bild und gib die Informationen als JSON zurück."},
                    {
                        "type": "image_url",
                        "image_url": {"url": data_uri, "detail": "high"},
                    },
                ],
            },
        ]
    else:
        # Plain text output (backwards compatible)
        messages = [
            {
                "role": "system",
                "content": (
                    "Du bist ein Assistent für einen Baumarkt-Produktfinder. "
                    "Analysiere das Bild und beschreibe NUR die Produkte, die du siehst. "
                    "Fokussiere dich auf das, was im Vordergrund ist - das ist normalerweise das Hauptprodukt. "
                    "Ignoriere Hintergrund-Elemente wie Personen, Wände oder andere nicht relevante Objekte. "
                    "Fokussiere dich auf: Produktname, Typ, Material, Farbe, Größe, Form und wichtige Details. "
                    "Wenn keine Produkte im Bild sind, schreibe 'Kein Produkt erkannt'. "
                    "Gib eine kurze, präzise Produktbeschreibung auf Deutsch zurück."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Beschreibe nur das Produkt im Vordergrund. Beschreibe die Produkte in diesem Bild detailliert. Nenne Produktname, Typ, Material, Farbe und wichtige Merkmale."},
                    {
                        "type": "image_url",
                        "image_url": {"url": data_uri, "detail": "high"},
                    },
                ],
            },
        ]

    body = {
        "model": OPENAI_MODEL,
        "messages": messages,
        "max_tokens": 500 if structured else 300,
    }
    # Add response_format only if structured and model supports it
    if structured:
        body["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {OPENAI_API_TOKEN}",
        "Content-Type": "application/json",
    }
    url = f"{OPENAI_BASE_URL.rstrip('/')}/chat/completions"

    response = requests.post(
        url,
        json=body,
        headers=headers,
        verify=VERIFY_SSL,
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()

    content = payload["choices"][0]["message"]["content"].strip()
    
    if structured:
        # Try to parse JSON
        import json
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Fallback: return as plain text if JSON parsing fails
            print(f"[WARNING] Failed to parse JSON from AI response: {content}")
            return {"produktname": content, "typ": "", "material": "", "farbe": "", "groesse": "", "form": "", "behaelter": "", "wichtige_merkmale": ""}
    
    return content
