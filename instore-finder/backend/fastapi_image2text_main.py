import os
import base64
import mimetypes
import requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from product_service import answer_query, answer_from_image

load_dotenv()

IONOS_API_TOKEN = os.getenv("IONOS_API_TOKEN")
IONOS_ENDPOINT = os.getenv("IONOS_ENDPOINT")
MODEL_NAME = os.getenv("MODEL_NAME", "mistralai/Mistral-Small")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() == "true"


if not IONOS_API_TOKEN:
    raise RuntimeError("Set the IONOS_API_TOKEN environment variable.")

HEADERS = {
    "Authorization": f"Bearer {IONOS_API_TOKEN}",
    "Content-Type": "application/json",
}

app = FastAPI(title="Image/Text → ProdId (IONOS + Mistral)")

# Allow Next.js app (http://localhost:3000) to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/text_to_prod_id")
def text_to_prod_id(
    text: str = Form(..., description="Text description or product ID of the product"),
):
    
    prod_position = answer_query(text)
    return JSONResponse({"prod_position": prod_position})
    

@app.post("/image_to_prod_id")
def image_to_text(
    file: str = Form(..., description="Path of a JPEG image"),
):
    prod_position = answer_from_image(file)
    return JSONResponse({"prod_position": prod_position})

   