import os
import requests
import sys

IONOS_API_TOKEN  = os.getenv("SPEECH_TO_TEXT_API_KEY")

ENDPOINT = os.getenv("SPEECH_TO_TEXT_ENDPOINT")
MODEL_NAME = "gpt-4o-transcribe" #"mistralai/Mistral-Small-24B-Instruct"

# curl -X POST "https://jnav-miyxznmd-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4o-transcribe/audio/transcriptions?api-version=2025-03-01-preview" \
#   -H "Content-Type: multipart/form-data" \
#   -H "Authorization: Bearer $AZURE_API_KEY" \
#   -d '{
#      "model": "gpt-4o-transcribe",
#      "file": "@path/to/file/audio.wav"
#     }'

def transcribe_audio(audio_file_path: str) -> str:
    """Return only the German description text for the audio file."""

    data = {
        "model": MODEL_NAME,
        "language": "de",
    }

    headers = {
        "api-key": IONOS_API_TOKEN ,   #         "Authorization": f"Bearer {IONOS_API_TOKEN}",    
    }

    # multipart/form-data payload
    files = {
        # name "file" must match what the API expects
        "file": (os.path.basename(audio_file_path), open(audio_file_path, "rb"), "audio/mpeg"),
    }

    resp = requests.post(ENDPOINT, headers=headers, data=data, files=files, verify=False)
    resp.raise_for_status()
    payload = resp.json()

    return payload.get("text", "")


# CLI usage: python image_to_text_ionos.py image.jpg
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python {sys.argv[0]} <audio_path>")
        sys.exit(1)

    audio_path = sys.argv[1]
    text = transcribe_audio(audio_path)
    print("\n=== AUDIO TEXT ===\n")
    print(text)
