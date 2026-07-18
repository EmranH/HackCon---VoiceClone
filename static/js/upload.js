const dropZone = document.getElementById("dropZone");
const audioFileInput = document.getElementById("audioFileInput");
const browseButton = document.getElementById("browseButton");

const uploadTab = document.getElementById("uploadTab");
const recordTab = document.getElementById("recordTab");
const uploadSection = document.getElementById("uploadSection");
const recordSection = document.getElementById("recordSection");

const audioPreview = document.getElementById("audioPreview");
const audioPlayer = document.getElementById("audioPlayer");
const selectedFileName = document.getElementById("selectedFileName");
const fileSize = document.getElementById("fileSize");
const audioDuration = document.getElementById("audioDuration");
const audioFormat = document.getElementById("audioFormat");

const removeAudioButton = document.getElementById("removeAudioButton");
const consentCheckbox = document.getElementById("consentCheckbox");
const analyseButton = document.getElementById("analyseButton");
const analysisMessage = document.getElementById("analysisMessage");

let currentAudioUrl = null;
let selectedAudioFile = null;

function switchTab(selectedTab, selectedSection) {
    uploadTab.classList.remove("active");
    recordTab.classList.remove("active");

    uploadSection.classList.remove("active");
    recordSection.classList.remove("active");

    selectedTab.classList.add("active");
    selectedSection.classList.add("active");
}

uploadTab.addEventListener("click", () => {
    switchTab(uploadTab, uploadSection);
});

recordTab.addEventListener("click", () => {
    switchTab(recordTab, recordSection);
});

browseButton.addEventListener("click", () => {
    audioFileInput.click();
});

dropZone.addEventListener("click", (event) => {
    if (event.target !== browseButton) {
        audioFileInput.click();
    }
});

audioFileInput.addEventListener("change", () => {
    const file = audioFileInput.files[0];

    if (file) {
        processAudioFile(file);
    }
});

dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragging");
});

dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");

    const file = event.dataTransfer.files[0];

    if (file) {
        processAudioFile(file);
    }
});

function processAudioFile(file) {
    const allowedTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav"
    ];

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (
        !allowedTypes.includes(file.type) &&
        !["mp3", "wav"].includes(fileExtension)
    ) {
        alert("Please select an MP3 or WAV audio file.");
        return;
    }

    selectedAudioFile = file;
    showAudioPreview(file);
}

function showAudioPreview(file) {
    clearAudioUrl();

    currentAudioUrl = URL.createObjectURL(file);
    audioPlayer.src = currentAudioUrl;

    selectedFileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    audioFormat.textContent =
        file.name.split(".").pop().toUpperCase();

    audioPreview.classList.remove("hidden");

    audioPlayer.addEventListener(
        "loadedmetadata",
        () => {
            audioDuration.textContent = formatDuration(
                audioPlayer.duration
            );
        },
        { once: true }
    );

    consentCheckbox.checked = false;
    analyseButton.disabled = true;
    analysisMessage.textContent = "";

    audioPreview.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function useRecordedAudio(blob, fileName) {
    const recordedFile = new File(
        [blob],
        fileName,
        { type: blob.type || "audio/webm" }
    );

    selectedAudioFile = recordedFile;
    showAudioPreview(recordedFile);

    audioFormat.textContent = "WEBM";
}

function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) {
        return "—";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}

function clearAudioUrl() {
    if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
        currentAudioUrl = null;
    }
}

function removeCurrentAudio() {
    clearAudioUrl();

    selectedAudioFile = null;
    audioFileInput.value = "";
    audioPlayer.removeAttribute("src");
    audioPlayer.load();

    selectedFileName.textContent = "No file selected";
    fileSize.textContent = "—";
    audioDuration.textContent = "—";
    audioFormat.textContent = "—";

    consentCheckbox.checked = false;
    analyseButton.disabled = true;
    analysisMessage.textContent = "";

    audioPreview.classList.add("hidden");
}

removeAudioButton.addEventListener("click", removeCurrentAudio);

consentCheckbox.addEventListener("change", () => {
    analyseButton.disabled =
        !consentCheckbox.checked || !selectedAudioFile;
});

analyseButton.addEventListener("click", uploadAudioForAnalysis);

async function uploadAudioForAnalysis() {
    if (!selectedAudioFile || !consentCheckbox.checked) {
        return;
    }

    analyseButton.disabled = true;
    analyseButton.textContent = "Uploading...";
    analysisMessage.classList.remove("error-message");
    analysisMessage.textContent = "Saving your audio securely...";

    const formData = new FormData();
    formData.append("audio", selectedAudioFile);

    try {
        const response = await fetch("/api/upload-audio", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "The audio could not be uploaded."
            );
        }

        analysisMessage.textContent =
            `Upload complete: ${result.file.original_name}`;

        analyseButton.textContent = "Audio Uploaded";

        console.log("Saved audio:", result.file);
    } catch (error) {
        console.error(error);

        analysisMessage.classList.add("error-message");
        analysisMessage.textContent = error.message;

        analyseButton.disabled = false;
        analyseButton.textContent = "Analyse Voice";
    }
}

window.useRecordedAudio = useRecordedAudio;