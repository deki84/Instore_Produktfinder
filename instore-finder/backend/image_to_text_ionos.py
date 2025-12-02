# backend/image_to_text_ionos.py

import os
import base64
import mimetypes
import requests
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

IONOS_API_TOKEN = os.getenv("IONOS_API_TOKEN")
IONOS_ENDPOINT = os.getenv("IONOS_ENDPOINT")  # e.g. https://openai.inference.de-txl.ionos.com/v1/chat/completions
MODEL_NAME = os.getenv("MODEL_NAME", "mistralai/Mistral-Small-24B-Instruct")

if not IONOS_API_TOKEN:
    raise RuntimeError("IONOS_API_TOKEN is not set in .env")


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
                "You are an assistant that describes images. "
                "Return a short and precise description of the image in English."
            ),
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Describe this image briefly."},
                {
                    "type": "image_url",
                    "image_url": {"url": data_uri, "detail": "high"},
                },
            ],
        },
    ]

    body = {
        "model": MODEL_NAME,
        "messages": messages,
        "max_completion_tokens": 300,
    }

    headers = {
        "Authorization": f"Bearer {IONOS_API_TOKEN}",
        "Content-Type": "application/json",
    }

    response = requests.post(
        IONOS_ENDPOINT,
        json=body,
        headers=headers,
        verify=False,  # if you have proper SSL, set this to True
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()

    return payload["choices"][0]["message"]["content"]
