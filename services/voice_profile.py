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

        self.profiles_folder.mkdir(
            parents=True,
            exist_ok=True
        )

        self.database_file.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        if not self.database_file.exists():

            self.database_file.write_text(
                json.dumps(
                    [],
                    indent=4
                ),
                encoding="utf-8"
            )


    # =====================================================
    # CREATE PROFILE
    # =====================================================

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

            raise ValueError(
                "A profile name is required."
            )


        # Only allow a filename,
        # not a path supplied by the browser.
        safe_stored_filename = (
            Path(stored_filename).name
        )


        if (
            not safe_stored_filename
            or safe_stored_filename
            != stored_filename
        ):

            raise ValueError(
                "The uploaded audio filename is invalid."
            )


        source_path = (
            self.temp_folder
            / safe_stored_filename
        )


        if not source_path.exists():

            raise FileNotFoundError(
                "The uploaded audio file could not be found."
            )


        extension = (
            source_path
            .suffix
            .lower()
        )


        if not extension:

            raise ValueError(
                "The uploaded audio file has no extension."
            )


        profile_id = (
            uuid4().hex
        )


        profile_audio_name = (
            f"{profile_id}{extension}"
        )


        destination_path = (
            self.profiles_folder
            / profile_audio_name
        )


        shutil.move(
            str(source_path),
            str(destination_path)
        )


        # Use the actual file extension,
        # not only what the frontend sent.
        actual_format = (
            extension
            .replace(".", "")
            .upper()
        )


        profile = {

            "id":
                profile_id,

            "name":
                clean_name,

            "original_filename":
                original_filename,

            "stored_filename":
                profile_audio_name,

            "format":
                actual_format,

            "file_size":
                file_size,

            "duration":
                duration,

            "created_at":
                datetime.now(
                    timezone.utc
                ).isoformat()
        }


        profiles = (
            self.get_profiles()
        )


        profiles.append(
            profile
        )


        self._save_profiles(
            profiles
        )


        return profile


    # =====================================================
    # GET ALL PROFILES
    # =====================================================

    def get_profiles(
        self
    ) -> list[dict]:

        try:

            content = (
                self.database_file
                .read_text(
                    encoding="utf-8"
                )
            )


            profiles = (
                json.loads(
                    content
                )
            )


            if not isinstance(
                profiles,
                list
            ):

                return []


        except (
            json.JSONDecodeError,
            FileNotFoundError
        ):

            return []


        # Try to repair old profile records
        # where the ID is correct but the
        # file extension in JSON is wrong.
        changed = False


        for profile in profiles:

            stored_filename = str(
                profile.get(
                    "stored_filename",
                    ""
                )
            ).strip()


            if not stored_filename:

                continue


            safe_filename = (
                Path(
                    stored_filename
                ).name
            )


            if (
                safe_filename
                != stored_filename
            ):

                continue


            expected_path = (
                self.profiles_folder
                / safe_filename
            )


            # File exists exactly as stored.
            if expected_path.exists():

                continue


            stored_path = Path(
                safe_filename
            )


            stem = (
                stored_path.stem
            )


            # Look for the same profile ID
            # with a different extension.
            possible_matches = list(
                self.profiles_folder.glob(
                    f"{stem}.*"
                )
            )


            if len(
                possible_matches
            ) != 1:

                continue


            real_file = (
                possible_matches[0]
            )


            real_extension = (
                real_file
                .suffix
                .lower()
            )


            profile[
                "stored_filename"
            ] = real_file.name


            profile[
                "format"
            ] = (
                real_extension
                .replace(".", "")
                .upper()
            )


            changed = True


        # Save repaired records.
        if changed:

            self._save_profiles(
                profiles
            )


        return profiles


    # =====================================================
    # GET SINGLE PROFILE
    # =====================================================

    def get_profile(
        self,
        profile_id: str
    ) -> dict | None:

        clean_profile_id = str(
            profile_id
        ).strip()


        if not clean_profile_id:

            return None


        for profile in (
            self.get_profiles()
        ):

            if (
                profile.get("id")
                == clean_profile_id
            ):

                return profile


        return None


    # =====================================================
    # SAVE DATABASE
    # =====================================================

    def _save_profiles(
        self,
        profiles: list[dict]
    ) -> None:

        self.database_file.write_text(

            json.dumps(
                profiles,
                indent=4
            ),

            encoding="utf-8"
        )