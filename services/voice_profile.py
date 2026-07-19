import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


class VoiceProfileService:
    def __init__(
        self,
        temp_folder: Path,
        profiles_folder: Path,
        database_file: Path
    ):
        self.temp_folder = temp_folder
        self.profiles_folder = profiles_folder
        self.database_file = database_file

        self.profiles_folder.mkdir(parents=True, exist_ok=True)
        self.database_file.parent.mkdir(parents=True, exist_ok=True)

        if not self.database_file.exists():
            self.database_file.write_text(
                json.dumps([], indent=4),
                encoding="utf-8"
            )

    def create_profile(
        self,
        profile_name: str,
        stored_filename: str,
        original_filename: str,
        audio_format: str,
        file_size: str,
        duration: str
    ) -> dict:
        clean_name = profile_name.strip()

        if not clean_name:
            raise ValueError("A profile name is required.")

        source_path = self.temp_folder / stored_filename

        if not source_path.exists():
            raise FileNotFoundError(
                "The uploaded audio file could not be found."
            )

        profile_id = uuid4().hex
        extension = source_path.suffix.lower()
        profile_audio_name = f"{profile_id}{extension}"
        destination_path = self.profiles_folder / profile_audio_name

        shutil.move(str(source_path), str(destination_path))

        profile = {
            "id": profile_id,
            "name": clean_name,
            "original_filename": original_filename,
            "stored_filename": profile_audio_name,
            "format": audio_format,
            "file_size": file_size,
            "duration": duration,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        profiles = self.get_profiles()
        profiles.append(profile)

        self.database_file.write_text(
            json.dumps(profiles, indent=4),
            encoding="utf-8"
        )

        return profile

    def get_profiles(self) -> list[dict]:
        try:
            content = self.database_file.read_text(encoding="utf-8")
            return json.loads(content)
        except (json.JSONDecodeError, FileNotFoundError):
            return []