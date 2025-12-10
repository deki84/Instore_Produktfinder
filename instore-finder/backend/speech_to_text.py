import os
import requests
import tempfile
from dotenv import load_dotenv

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("[WARNING] pydub not available, audio conversion disabled")

load_dotenv()

# Unterstütze beide Variablennamen für Kompatibilität
SPEECH_API_TOKEN = os.getenv("SPEECH_TO_TEXT_API_KEY") or os.getenv("SPEECH_API_TOKEN")
ENDPOINT = os.getenv("SPEECH_TO_TEXT_ENDPOINT") or os.getenv("ENDPOINT")
MODEL_NAME = "gpt-4o-transcribe"
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() == "true"

def transcribe_audio(audio_file_path: str) -> str:
    """Return only the German description text for the audio file."""
    
    if not SPEECH_API_TOKEN:
        raise RuntimeError("SPEECH_TO_TEXT_API_KEY is not set in .env")
    
    if not ENDPOINT:
        raise RuntimeError("SPEECH_TO_TEXT_ENDPOINT is not set in .env")

    # Konvertiere webm zu MP3, wenn nötig
    final_audio_path = audio_file_path
    content_type = "audio/mpeg"
    should_delete_temp = False
    
    if audio_file_path.endswith('.webm') and PYDUB_AVAILABLE:
        try:
            print(f"[DEBUG] Converting webm to MP3: {audio_file_path}")
            audio = AudioSegment.from_file(audio_file_path, format="webm")
            # Erstelle temporäre MP3-Datei
            temp_mp3 = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            temp_mp3_path = temp_mp3.name
            temp_mp3.close()
            
            # Exportiere als MP3
            audio.export(temp_mp3_path, format="mp3")
            final_audio_path = temp_mp3_path
            should_delete_temp = True
            print(f"[DEBUG] Converted to MP3: {temp_mp3_path}")
        except Exception as e:
            print(f"[WARNING] Failed to convert webm to MP3: {e}. Trying original format.")
            content_type = "audio/webm"
    else:
        # Bestimme Content-Type basierend auf Dateiendung
        if audio_file_path.endswith('.wav'):
            content_type = "audio/wav"
        elif audio_file_path.endswith('.mp3'):
            content_type = "audio/mpeg"
        elif audio_file_path.endswith('.m4a'):
            content_type = "audio/m4a"
        elif audio_file_path.endswith('.webm'):
            content_type = "audio/webm"

    data = {
        "model": MODEL_NAME,
        "language": "de",
    }

    headers = {
        "api-key": SPEECH_API_TOKEN,
    }

    try:
        print(f"[DEBUG] Sending audio to endpoint: {ENDPOINT}")
        print(f"[DEBUG] Audio file: {final_audio_path}")
        
        # Öffne Datei und sende sie direkt - wie im funktionierenden Code
        files = {
            # name "file" must match what the API expects
            "file": (os.path.basename(final_audio_path), open(final_audio_path, "rb"), content_type),
        }
        
        resp = requests.post(
            ENDPOINT, 
            headers=headers, 
            data=data, 
            files=files, 
            verify=False,  # Wie im funktionierenden Code des Kollegen
            timeout=30
        )
        
        print(f"[DEBUG] Response status: {resp.status_code}")
        if resp.status_code != 200:
            error_text = resp.text
            print(f"[ERROR] Azure API Error Response: {error_text}")
            raise RuntimeError(f"Azure API returned {resp.status_code}: {error_text}")
        
        resp.raise_for_status()
        payload = resp.json()
        print(f"[DEBUG] API Response: {payload}")
        
        result = payload.get("text", "")
        
        # Schließe die Datei, die wir geöffnet haben
        files["file"][1].close()
    finally:
        # Lösche temporäre MP3-Datei, falls erstellt
        if should_delete_temp and os.path.exists(final_audio_path):
            try:
                os.remove(final_audio_path)
            except OSError:
                pass

    return result

