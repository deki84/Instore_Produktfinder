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


def image_to_text(image_path: str) -> str:
    """
    Takes an image path, encodes the image and calls the IONOS model.
    Returns a short English description of the image.
    """
    data_uri = file_to_data_uri(image_path)

    messages = [
        {
            "role": "system",
            "content": (
                    "Du bist ein Assistent, der Bilder beschreibt. "
                    "Gib eine kurze und präzise Beschreibung des Bildes auf Deutsch zurück."
            ),
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Beschreibe dieses Bild kurz."},
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
        "max_tokens": 300,
    }

    headers = {
        "Authorization": f"Bearer {OPENAI_API_TOKEN}",
        "Content-Type": "application/json",
    }
    url = f"{OPENAI_BASE_URL.rstrip('/')}/chat/completions"

    response = requests.post(
        url,
        json=body,
        headers=headers,
        verify=VERIFY_SSL,  # if you have proper SSL, set this to True
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()

    return payload["choices"][0]["message"]["content"].strip()
