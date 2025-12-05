import os
import base64
import mimetypes
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from product_service import answer_query, answer_from_image, answer_from_image_structured, get_product_by_art_nr

load_dotenv()

OPENAI_API_TOKEN = os.getenv("OPENAI_API_TOKEN")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL","https://test-jena-openai.openai.azure.com/openai/v1/chat/completions")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() == "true"


if not OPENAI_API_TOKEN:
    raise RuntimeError("Set the OPENAI_API_TOKEN environment variable.")

HEADERS = {
    "Authorization": f"Bearer {OPENAI_API_TOKEN}",
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
async def image_to_prod_id(
    file: UploadFile = File(..., description="JPEG image from camera or upload"),
    structured: bool = Form(False, description="Return structured product data instead of text"),
):
    """
    Receive an image (UploadFile) from the frontend, 
    write it to a temporary file, and pass the file path to answer_from_image.
    
    If structured=True, returns JSON with products array instead of text string.
    """
    # 1) Read the file content from the incoming request
    content = await file.read()

    # 2) Create a temporary file inside the container
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 3) Now the file really exists on disk. product_service.answer_from_image
        #    can work with the file path (image_to_text_ionos.py reads from this path).
        if structured:
            # Return structured product data
            result = answer_from_image_structured(tmp_path, limit=5)
            return JSONResponse(result)
        else:
            # Return text string (backwards compatible)
            prod_position = answer_from_image(tmp_path)
            return JSONResponse({"prod_position": prod_position})
    finally:
        # 4) Cleanup: remove the temp file again (optional but clean)
        try:
            os.remove(tmp_path)
        except OSError:
            pass
@app.get("/obi_image/{art_nr}")
def get_obi_image(art_nr: str):
    """
    Returns the image URL for a given Art_Nr from our Supabase products table.
    """
    # 1) Find product in the in-memory list
    product = get_product_by_art_nr(art_nr)
    if not product:
        # Product not in our DB
        raise HTTPException(
            status_code=404,
            detail=f"Produkt mit Art_Nr {art_nr} nicht in unserer DB gefunden.",
        )

    # 2) Get obi_image_url from that row
    image_url = product.get("obi_image_url")
    if not image_url:
        # Product exists but has no image URL
        raise HTTPException(
            status_code=404,
            detail=f"Kein Bild für Art_Nr {art_nr} in obi_image_url hinterlegt.",
        )

    # 3) Return the payload for the frontend
    return {
        "art_nr": art_nr,
        "imageUrl": image_url,
    }


   