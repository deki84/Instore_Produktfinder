# Python example to retrieve available models
#usage example: python.exe c:/NavarroProgs/AI-Thon/ObiSearch/image_to_text.py "C:\NavarroProgs\AI-Thon\ObiSearch\8200735.jpeg"

import requests
import mimetypes
import base64
import sys
import json

IONOS_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJraWQiOiJmNWJhZWNhYi1mODVjLTRmMDAtODhhOC0wMzc5YzA0ZDIzOWYiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJpb25vc2Nsb3VkIiwiaWF0IjoxNzYzNzUzMDU0LCJjbGllbnQiOiJVU0VSIiwiaWRlbnRpdHkiOnsiaXNQYXJlbnQiOmZhbHNlLCJjb250cmFjdE51bWJlciI6MzY3MzIyMzksInJvbGUiOiJ1c2VyIiwicmVnRG9tYWluIjoiaW9ub3MuZGUiLCJyZXNlbGxlcklkIjoxLCJ1dWlkIjoiMWMxMTJiMjYtODA0Mi00MjI5LWEwZDQtMTU1Njk3OGIyOTMxIiwicHJpdmlsZWdlcyI6WyJBQ0NFU1NfQU5EX01BTkFHRV9MT0dHSU5HIiwiTUFOQUdFX1JFR0lTVFJZIiwiQUNDRVNTX0FORF9NQU5BR0VfQ0VSVElGSUNBVEVTIiwiQUNDRVNTX0FORF9NQU5BR0VfQVBJX0dBVEVXQVkiLCJCQUNLVVBfVU5JVF9DUkVBVEUiLCJBQ0NFU1NfQU5EX01BTkFHRV9ETlMiLCJNQU5BR0VfREFUQVBMQVRGT1JNIiwiQUNDRVNTX0FORF9NQU5BR0VfQUlfTU9ERUxfSFVCIiwiTUFOQUdFX0RCQUFTIiwiQ1JFQVRFX0lOVEVSTkVUX0FDQ0VTUyIsIlBDQ19DUkVBVEUiLCJBQ0NFU1NfQU5EX01BTkFHRV9ORVRXT1JLX0ZJTEVfU1RPUkFHRSIsIkFDQ0VTU19BTkRfTUFOQUdFX1ZQTiIsIkFDQ0VTU19BTkRfTUFOQUdFX0NETiIsIks4U19DTFVTVEVSX0NSRUFURSIsIlNOQVBTSE9UX0NSRUFURSIsIkZMT1dfTE9HX0NSRUFURSIsIkFDQ0VTU19BTkRfTUFOQUdFX01PTklUT1JJTkciLCJBQ0NFU1NfQU5EX01BTkFHRV9LQUFTIiwiQUNDRVNTX1MzX09CSkVDVF9TVE9SQUdFIiwiQUNDRVNTX0FORF9NQU5BR0VfSUFNX1JFU09VUkNFUyIsIklQX0JMT0NLX1JFU0VSVkUiLCJDUkVBVEVfTkVUV09SS19TRUNVUklUWV9HUk9VUFMiXX0sImV4cCI6MTc2MzgzOTQ1NH0.XZLRiMWs5lqMQNLo1S3ewhyjy-UvUXRCzUaCMYvVFZZy3jkMu9fIsgMZycH2JZHRMWIzfBUal7hBM-vlKZDOMy8KVl0tZwcevj6NEvGfxIiS_hxMVVI25Uya1sGtbLmQgydBDiKjuhjMSIs2dM0GvIYzF6OUVQtUPzDMCgAARwsxcIcSFP-RZiemfOmdZnU2HaglQ44miLo6fTfMwBp1_1U9jGvTCZvKYA8qk4GEg_hlHvq691CA0zi3KgVo7EF1TT38tA-Yd6dbQMs5GCWF4O0q4QtiAe4I_nW6J1lxBkVNid9gd-4tmGuwrYBT9OLUX_BpcXp8lza5f4vkLCdrZg"

endpoint = "https://openai.inference.de-txl.ionos.com/v1/chat/completions" #"https://openai.inference.de-txl.ionos.com/v1/models"

header = {
    "Authorization": f"Bearer {IONOS_API_TOKEN}", 
    "Content-Type": "application/json"
}

MODEL_NAME = "mistralai/Mistral-Small-24B-Instruct" 

def file_to_data_uri(path):
    # Guess MIME (falls back to JPEG)
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"

def main(image_path: str):

# Point this at your image
#8200735.jpeg
#image_path = r"C:\NavarroProgs\AI-Thon\ObiSearch\8200735.jpeg" #1010743.jpeg"
    data_uri = file_to_data_uri(image_path)

    messages = [
        {"role": "system",
        "content": "You are an assitant that converts image to text. Return a text description of the image."},
        {"role": "user",
        "content": [
            {"type": "text", "text": "What is a textual description for this image."},
            {"type": "image_url",
            "image_url": {"url": data_uri, "detail": "high"}}
        ]}
    ]

    body = {
        "model": MODEL_NAME,
        "messages": messages,
        # IONOS supports max_completion_tokens; max_tokens also works but is marked deprecated in their spec
        "max_completion_tokens": 1000
    }

    resp = requests.post(endpoint, json=body, headers=header, verify=False)  # verify=False only if you know why
    resp.raise_for_status()
    payload = resp.json()

    print("Raw response:\n", json.dumps(payload, indent=2))
    print("\nOCR text:\n", payload["choices"][0]["message"]["content"])

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python {sys.argv[0]} <image_path>")
        sys.exit(1)
    
    # Extract the string argument
    input_string = sys.argv[1]

    # Call main with the provided string
    main(input_string)
