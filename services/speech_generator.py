from pathlib import Path
from typing import Optional

import torch
import torchaudio
from chatterbox.tts import ChatterboxTTS


class SpeechGeneratorService:
    """Generate cloned speech using Chatterbox TTS."""

    def __init__(self) -> None:
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._model: Optional[ChatterboxTTS] = None

    def _load_model(self) -> ChatterboxTTS:
        """Load the model once and reuse it for future requests."""
        if self._model is None:
            print(f"Loading Chatterbox on {self.device}...")
            self._model = ChatterboxTTS.from_pretrained(
                device=self.device
            )
            print("Chatterbox loaded successfully.")

        return self._model

    def generate_speech(
        self,
        text: str,
        reference_audio_path: str | Path,
        output_path: str | Path,
    ) -> Path:
        """Generate cloned speech and save it as a WAV file."""

        cleaned_text = text.strip()

        if not cleaned_text:
            raise ValueError("Text cannot be empty.")

        reference_audio = Path(reference_audio_path)
        output_file = Path(output_path)

        if not reference_audio.exists():
            raise FileNotFoundError(
                f"Reference audio was not found: {reference_audio}"
            )

        if reference_audio.suffix.lower() != ".wav":
            raise ValueError(
                "The reference audio must be a WAV file."
            )

        output_file.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        model = self._load_model()

        print(f"Generating speech using: {reference_audio.name}")

        wav = model.generate(
            text=cleaned_text,
            audio_prompt_path=str(reference_audio),
        )

        torchaudio.save(
            str(output_file),
            wav.detach().cpu(),
            model.sr,
        )

        print(f"Generated audio saved to: {output_file}")

        return output_file