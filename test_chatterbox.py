from pathlib import Path

from services.speech_generator import SpeechGeneratorService


BASE_DIR = Path(__file__).resolve().parent

PROFILE_FOLDER = BASE_DIR / "static" / "uploads" / "profiles"
OUTPUT_FOLDER = BASE_DIR / "static" / "generated"

reference_files = list(PROFILE_FOLDER.glob("*.wav"))

if not reference_files:
    raise FileNotFoundError(
        f"No WAV reference audio found inside: {PROFILE_FOLDER}"
    )

reference_audio = reference_files[0]
output_file = OUTPUT_FOLDER / "service_test.wav"

generator = SpeechGeneratorService()

generator.generate_speech(
    text=(
        "This voice was generated through the new speech generation "
        "service. The Chatterbox integration is now working."
    ),
    reference_audio_path=reference_audio,
    output_path=output_file,
)

print("✅ Service test completed successfully!")