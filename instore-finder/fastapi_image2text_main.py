import os
import base64
import mimetypes
import requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

# ====== Config ======
IONOS_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJraWQiOiJmNWJhZWNhYi1mODVjLTRmMDAtODhhOC0wMzc5YzA0ZDIzOWYiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpb25vc2Nsb3VkIiwiaWF0IjoxNzYzNzUzMDU0LCJjbGllbnQiOiJVU0VSIiwiaWRlbnRpdHkiOnsiaXNQYXJlbnQiOmZhbHNlLCJjb250cmFjdE51bWJlciI6MzY3MzIyMzksInJvbGUiOiJ1c2VyIiwicmVnRG9tYWluIjoiaW9ub3MuZGUiLCJyZXNlbGxlcklkIjoxLCJ1dWlkIjoiMWMxMTJiMjYtODA0Mi00MjI5LWEwZDQtMTU1Njk3OGIyOTMxIiwicHJpdmlsZWdlcyI6WyJBQ0NFU1NfQU5EX01BTkFHRV9MT0dHSU5HIiwiTUFOQUdFX1JFR0lTVFJZIiwiQUNDRVNTX0FORF9NQU5BR0VfQ0VSVElGSUNBVEVTIiwiQUNDRVNTX0FORF9NQU5BR0VfQVBJX0dBVEVXQVkiLCJCQUNLVVBfVU5JVF9DUkVBVEUiLCJBQ0NFU1NfQU5EX01BTkFHRV9ETlMiLCJNQU5BR0VfREFUQVBMQVRGT1JNIiwiQUNDRVNTX0FORF9NQU5BR0VfQUlfTU9ERUxfSFVCIiwiTUFOQUdFX0RCQUFTIiwiQ1JFQVRFX0lOVEVSTkVUX0FDQ0VTUyIsIlBDQ19DUkVBVEUiLCJBQ0NFU1NfQU5EX01BTkFHRV9ORVRXT1JLX0ZJTEVfU1RPUkFHRSIsIkFDQ0VTU19BTkRfTUFOQUdFX1ZQTiIsIkFDQ0VTU19BTkRfTUFOQUdFX0NETiIsIks4U19DTFVTVEVSX0NSRUFURSIsIlNOQVBTSE9UX0NSRUFURSIsIkZMT1dfTE9HX0NSRUFURSIsIkFDQ0VTU19BTkRfTUFOQUdFX01PTklUT1JJTkciLCJBQ0NFU1NfQU5EX01BTkFHRV9LQUFTIiwiQUNDRVNTX1MzX09CSkVDVF9TVE9SQUdFIiwiQUNDRVNTX0FORF9NQU5BR0VfSUFNX1JFU09VUkNFUyIsIklQX0JMT0NLX1JFU0VSVkUiLCJDUkVBVEVfTkVUV09SS19TRUNVUklUWV9HUk9VUFMiXX0sImV4cCI6MTc2MzgzOTQ1NH0.XZLRiMWs5lqMQNLo1S3ewhyjy-UvUXRCzUaCMYvVFZZy3jkMu9fIsgMZycH2JZHRMWIzfBUal7hBM-vlKZDOMy8KVl0tZwcevj6NEvGfxIiS_hxMVVI25Uya1sGtbLmQgydBDiKjuhjMSIs2dM0GvIYzF6OUVQtUPzDMCgAARwsxcIcSFP-RZiemfOmdZnU2HaglQ44miLo6fTfMwBp1_1U9jGvTCZvKYA8qk4GEg_hlHvq691CA0zi3KgVo7EF1TT38tA-Yd6dbQMs5GCWF4O0q4QtiAe4I_nW6J1lxBkVNid9gd-4tmGuwrYBT9OLUX_BpcXp8lza5f4vkLCdrZg"
IONOS_ENDPOINT = "https://openai.inference.de-txl.ionos.com/v1/chat/completions"
MODEL_NAME = "mistralai/Mistral-Small-24B-Instruct"  # vision-capable on IONOS
REQUEST_TIMEOUT = 30  # seconds
VERIFY_SSL = 0 #   False

if not IONOS_API_TOKEN:
    raise RuntimeError("Set the IONOS_API_TOKEN environment variable.")

HEADERS = {
    "Authorization": f"Bearer {IONOS_API_TOKEN}",
    "Content-Type": "application/json",
}

app = FastAPI(title="Image/Text → ProdId (IONOS + Mistral)")

def _data_uri_from_bytes(content: bytes, filename: str | None, content_type: str | None) -> str:
    """Build a data: URI for the uploaded image."""
    mime = content_type or (mimetypes.guess_type(filename or "")[0]) or "image/jpeg"
    b64 = base64.b64encode(content).decode("ascii")
    return f"data:{mime};base64,{b64}"

def _build_messages(data_uri: str) -> list[dict]:
    """Compose multimodal messages for Chat Completions."""
    return [
        {
            "role": "system",
            "content": (
                "You are an assitant that converts image to text. Return a text description in German language of the image."                
            ),
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Give me a very short textual description for this image."},
                {"type": "image_url", "image_url": {"url": data_uri, "detail": "high"}},
            ],
        },
    ]

@app.get("/")
def health():
    return {"status": "ok"}

@app.post("/image_to_text")
def image_to_text(
    file: UploadFile = File(..., description="Upload a JPEG/PNG image"),
):
    # Read file
    try:
        content = file.file.read()
    except Exception:
        raise HTTPException(400, detail="Could not read uploaded file.")
    if not content:
        raise HTTPException(400, detail="Empty file.")

    # Basic type check
    ct = file.content_type or mimetypes.guess_type(file.filename or "")[0] or ""
    if not ct.startswith("image/"):
        raise HTTPException(400, detail=f"Unsupported content type: {ct or 'unknown'}")

    # Build data URI and request
    data_uri = _data_uri_from_bytes(content, file.filename, file.content_type)
    messages = _build_messages(data_uri)

    body = {
        "model": MODEL_NAME,
        "messages": messages,
        # IONOS supports max_completion_tokens for the response; prefer it over deprecated max_tokens.
        "max_completion_tokens": 1000,
    }

    try:
        r = requests.post(
            IONOS_ENDPOINT,
            json=body,
            headers=HEADERS,
            timeout=REQUEST_TIMEOUT,
            verify=VERIFY_SSL,
        )
        r.raise_for_status()
        payload = r.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {e}")

    # Extract text content safely
    try:
        text = payload["choices"][0]["message"]["content"]
    except Exception:
        raise HTTPException(
            502,
            detail=f"Unexpected response from model: {payload.get('error') or 'missing content'}",
        )

    # Include usage if available
    out = {"text": text, "model": MODEL_NAME}
    if "usage" in payload:
        out["usage"] = payload["usage"]

    return JSONResponse(out)
