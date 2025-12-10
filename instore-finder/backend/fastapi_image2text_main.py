import os
import base64
import mimetypes
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from product_service import answer_query, answer_from_image, answer_from_image_structured, get_product_by_art_nr
from speech_to_text import transcribe_audio
from text_to_speech import text_to_speech_wav

load_dotenv()

OPENAI_API_TOKEN = os.getenv("OPENAI_API_TOKEN")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL","https://test-jena-openai.openai.azure.com/openai/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() == "true"


if not OPENAI_API_TOKEN:
    raise RuntimeError("Set the OPENAI_API_TOKEN environment variable.")

HEADERS = {
    "Authorization": f"Bearer {OPENAI_API_TOKEN}",
    "Content-Type": "application/json",
}


app = FastAPI(title="Image/Text → ProdId (OPENAI)")

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


@app.post("/audio_to_text")
async def audio_to_text(
    file: UploadFile = File(..., description="Audio file (MP3, WAV, etc.) for transcription"),
):
    """
    Receive an audio file from the frontend, 
    write it to a temporary file, and transcribe it to German text.
    
    Returns JSON with transcribed text.
    """
    # 1) Read the file content from the incoming request
    content = await file.read()

    # 2) Create a temporary file inside the container
    # Determine file extension from content type or filename
    suffix = ".mp3"  # default
    if file.filename:
        _, ext = os.path.splitext(file.filename)
        if ext:
            suffix = ext
    elif file.content_type:
        if "wav" in file.content_type:
            suffix = ".wav"
        elif "mpeg" in file.content_type or "mp3" in file.content_type:
            suffix = ".mp3"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 3) Transcribe the audio file
        print(f"[DEBUG] Transcribing audio file: {tmp_path}, size: {len(content)} bytes")
        transcribed_text = transcribe_audio(tmp_path)
        print(f"[DEBUG] Transcribed text: {transcribed_text}")
        return JSONResponse({"text": transcribed_text})
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[ERROR] Audio transcription failed: {error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Fehler bei der Audio-Transkription: {str(e)}"
        )
    finally:
        # 4) Cleanup: remove the temp file
        try:
            os.remove(tmp_path)
        except OSError:
            pass


@app.post("/text_to_speech")
async def text_to_speech(
    text: str = Form(..., description="Text to convert to speech"),
    language: str = Form("de-DE", description="Language code (default: de-DE)"),
    voice: str = Form("de-DE-KatjaNeural", description="Voice name (default: de-DE-KatjaNeural)"),
):
    """
    Convert text to WAV audio using Azure Text-to-Speech.
    Returns WAV audio file.
    """
    try:
        print(f"[DEBUG] Converting text to speech: {text[:50]}...")
        wav_data = text_to_speech_wav(text, language=language, voice=voice)
        print(f"[DEBUG] Generated WAV audio: {len(wav_data)} bytes")
        
        return Response(
            content=wav_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "attachment; filename=speech.wav",
                "Content-Length": str(len(wav_data)),
            }
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[ERROR] Text-to-Speech failed: {error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Fehler bei der Text-zu-Sprache-Konvertierung: {str(e)}"
        )


@app.get("/obi_image/{art_nr}")
def get_obi_image(art_nr: str):
    """
    Return image URL for a given Art_Nr.

    - If the product does not exist → 404
    - If the product exists but has no image → imageUrl = null
      (frontend shows placeholder, no error)
    """
    # 1) Load product from product_service / DataFrame
    product = get_product_by_art_nr(art_nr)
    if product is None:
        raise HTTPException(
            status_code=404,
            detail=f"Kein Produkt mit Art_Nr {art_nr} gefunden.",
        )

    # 2) Normalize image URL: empty string -> None
    raw_val = product.get("obi_image_url")
    image_url = str(raw_val).strip() if raw_val else None

    # 3) Always return payload, even if image_url is None
    return {
        "art_nr": art_nr,
        "imageUrl": image_url,  # string oder null
    }