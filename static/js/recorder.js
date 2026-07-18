const startRecordingButton = document.getElementById(
    "startRecordingButton"
);

const stopRecordingButton = document.getElementById(
    "stopRecordingButton"
);

const recordingStatus = document.getElementById("recordingStatus");
const recordingTimer = document.getElementById("recordingTimer");
const recordStatusIcon = document.getElementById("recordStatusIcon");

let mediaRecorder = null;
let recordedChunks = [];
let recordingInterval = null;
let recordingSeconds = 0;
let microphoneStream = null;

startRecordingButton.addEventListener("click", startRecording);
stopRecordingButton.addEventListener("click", stopRecording);

async function startRecording() {
    try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        recordedChunks = [];

        mediaRecorder = new MediaRecorder(microphoneStream);

        mediaRecorder.addEventListener("dataavailable", (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener("stop", handleRecordingFinished);

        mediaRecorder.start();

        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = false;

        recordingStatus.textContent = "Recording...";
        recordStatusIcon.classList.add("recording");

        recordingSeconds = 0;
        updateTimer();

        recordingInterval = setInterval(() => {
            recordingSeconds += 1;
            updateTimer();
        }, 1000);
    } catch (error) {
        console.error(error);

        alert(
            "Microphone access was not allowed. Please check your browser permissions."
        );
    }
}

function stopRecording() {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
        return;
    }

    mediaRecorder.stop();

    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;

    recordingStatus.textContent = "Recording completed";
    recordStatusIcon.classList.remove("recording");

    clearInterval(recordingInterval);
}

function handleRecordingFinished() {
    const mimeType = mediaRecorder.mimeType || "audio/webm";

    const recordingBlob = new Blob(recordedChunks, {
        type: mimeType
    });

    const timeStamp = new Date()
        .toISOString()
        .replaceAll(":", "-")
        .replaceAll(".", "-");

    window.useRecordedAudio(
        recordingBlob,
        `voice-recording-${timeStamp}.webm`
    );

    if (microphoneStream) {
        microphoneStream.getTracks().forEach((track) => {
            track.stop();
        });

        microphoneStream = null;
    }
}

function updateTimer() {
    const minutes = Math.floor(recordingSeconds / 60);
    const seconds = recordingSeconds % 60;

    recordingTimer.textContent =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;
}