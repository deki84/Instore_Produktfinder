import os
import tempfile
from dotenv import load_dotenv

try:
    import azure.cognitiveservices.speech as speechsdk
    AZURE_SPEECH_AVAILABLE = True
except ImportError:
    AZURE_SPEECH_AVAILABLE = False
    print("[WARNING] azure-cognitiveservices-speech not available, TTS disabled")

load_dotenv()

# Azure Speech Service Configuration
SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY") or os.getenv("SPEECH_TO_TEXT_API_KEY")
SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION") or os.getenv("SPEECH_REGION", "eastus2")

def text_to_speech_wav(text: str, language: str = "de-DE", voice: str = "de-DE-KatjaNeural") -> bytes:
    """
    Convert text to WAV audio using Azure Text-to-Speech.
    Returns WAV audio as bytes.
    
    Args:
        text: Text to convert to speech
        language: Language code (default: "de-DE")
        voice: Voice name (default: "de-DE-KatjaNeural" - German female voice)
    
    Returns:
        bytes: WAV audio data
    """
    if not AZURE_SPEECH_AVAILABLE:
        raise RuntimeError("Azure Speech SDK not installed. Install with: pip install azure-cognitiveservices-speech")
    
    if not SPEECH_KEY:
        raise RuntimeError("AZURE_SPEECH_KEY or SPEECH_TO_TEXT_API_KEY is not set in .env")
    
    if not SPEECH_REGION:
        raise RuntimeError("AZURE_SPEECH_REGION is not set in .env")
    
    # Configure Azure Speech Service
    speech_config = speechsdk.SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
    
    # Set voice (German female voice by default)
    speech_config.speech_synthesis_voice_name = voice
    
    # Create temporary file for WAV output
    temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_wav_path = temp_wav.name
    temp_wav.close()
    
    try:
        # Configure audio output to file
        audio_config = speechsdk.audio.AudioOutputConfig(filename=temp_wav_path)
        
        # Create synthesizer
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=audio_config
        )
        
        # Synthesize speech
        print(f"[DEBUG] Synthesizing text to speech: {text[:50]}...")
        result = synthesizer.speak_text_async(text).get()
        
        # Check result
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            print(f"[DEBUG] Speech synthesized successfully to {temp_wav_path}")
            # Read WAV file as bytes
            with open(temp_wav_path, "rb") as f:
                wav_data = f.read()
            return wav_data
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = speechsdk.CancellationDetails(result)
            error_msg = f"Speech synthesis canceled: {cancellation_details.reason}"
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                error_msg += f" Error details: {cancellation_details.error_details}"
            raise RuntimeError(error_msg)
        else:
            raise RuntimeError(f"Speech synthesis failed with reason: {result.reason}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_wav_path):
            try:
                os.remove(temp_wav_path)
            except OSError:
                pass

