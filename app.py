from pathlib import Path
from uuid import uuid4

from flask import Flask, jsonify, render_template, request
from werkzeug.utils import secure_filename


app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
TEMP_UPLOAD_FOLDER = BASE_DIR / "static" / "uploads" / "temp"

ALLOWED_EXTENSIONS = {"mp3", "wav", "webm"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE

TEMP_UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


@app.route("/")
@app.route("/voicecloner")
def home():
    return render_template("index.html")


@app.route("/upload")
def upload():
    return render_template("upload.html")


@app.route("/generate")
def generate():
    return render_template("generate.html")


@app.route("/profiles")
def profile():
    return render_template("profile.html")


@app.route("/api/upload-audio", methods=["POST"])
def upload_audio():
    if "audio" not in request.files:
        return jsonify({
            "success": False,
            "message": "No audio file was provided."
        }), 400

    audio_file = request.files["audio"]

    if not audio_file.filename:
        return jsonify({
            "success": False,
            "message": "No audio file was selected."
        }), 400

    if not allowed_file(audio_file.filename):
        return jsonify({
            "success": False,
            "message": "Only MP3, WAV and WEBM files are supported."
        }), 400

    original_name = secure_filename(audio_file.filename)
    extension = original_name.rsplit(".", 1)[1].lower()

    unique_filename = f"{uuid4().hex}.{extension}"
    save_path = TEMP_UPLOAD_FOLDER / unique_filename

    audio_file.save(save_path)

    return jsonify({
        "success": True,
        "message": "Audio uploaded successfully.",
        "file": {
            "original_name": original_name,
            "stored_name": unique_filename,
            "format": extension.upper()
        }
    }), 201


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({
        "success": False,
        "message": "The audio file must be smaller than 25 MB."
    }), 413


if __name__ == "__main__":
    app.run(debug=True)