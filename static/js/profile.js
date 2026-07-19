const profileFileName =
    document.getElementById("profileFileName");

const profileFileSize =
    document.getElementById("profileFileSize");

const profileFileFormat =
    document.getElementById("profileFileFormat");

const profileAudioDuration =
    document.getElementById("profileAudioDuration");

const analysisStatus =
    document.getElementById("analysisStatus");

const statusBadge =
    document.getElementById("statusBadge");

const profileName =
    document.getElementById("profileName");

const profileMessage =
    document.getElementById("profileMessage");

const createProfileButton =
    document.getElementById("createProfileButton");

const analysisContent =
    document.getElementById("analysisContent");

const noAudioMessage =
    document.getElementById("noAudioMessage");

const uploadedAudioJson =
    sessionStorage.getItem("uploadedAudio");

let uploadedAudio = null;

if (uploadedAudioJson) {
    try {
        uploadedAudio = JSON.parse(uploadedAudioJson);
    } catch (error) {
        console.error("Could not read uploaded audio details:", error);
    }
}

if (!uploadedAudio) {
    analysisContent.classList.add("hidden");
    noAudioMessage.classList.remove("hidden");
} else {
    profileFileName.textContent =
        uploadedAudio.originalName || "Unknown";

    profileFileSize.textContent =
        uploadedAudio.size || "—";

    profileFileFormat.textContent =
        uploadedAudio.format || "—";

    profileAudioDuration.textContent =
        uploadedAudio.duration || "—";

    const suggestedProfileName =
        uploadedAudio.originalName
            ?.replace(/\.[^/.]+$/, "")
            .trim();

    if (suggestedProfileName) {
        profileName.value = `${suggestedProfileName} Voice`;
    }
}

createProfileButton?.addEventListener("click", createVoiceProfile);

async function createVoiceProfile() {
    const name = profileName.value.trim();

    profileMessage.classList.remove(
        "error-message",
        "success-message-text"
    );

    if (!name) {
        profileMessage.classList.add("error-message");
        profileMessage.textContent =
            "Please enter a name for the voice profile.";

        profileName.focus();
        return;
    }

    if (!uploadedAudio) {
        profileMessage.classList.add("error-message");
        profileMessage.textContent =
            "The uploaded audio information could not be found.";
        return;
    }

    createProfileButton.disabled = true;
    createProfileButton.textContent = "Creating Profile...";

    analysisStatus.textContent = "Saving voice profile";
    statusBadge.textContent = "Processing";
    statusBadge.classList.remove("ready", "complete");
    statusBadge.classList.add("processing");

    profileMessage.textContent =
        "Saving the uploaded audio and profile information...";

    const profileData = {
        name,
        stored_name: uploadedAudio.storedName,
        original_name: uploadedAudio.originalName,
        format: uploadedAudio.format,
        size: uploadedAudio.size,
        duration: uploadedAudio.duration
    };

    try {
        const response = await fetch("/api/voice-profiles", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message ||
                "The voice profile could not be created."
            );
        }

        analysisStatus.textContent = "Voice profile created";
        statusBadge.textContent = "Complete";
        statusBadge.classList.remove("processing");
        statusBadge.classList.add("complete");

        profileMessage.classList.add("success-message-text");
        profileMessage.textContent =
            `"${result.profile.name}" was created successfully.`;

        createProfileButton.textContent = "Profile Created";

        sessionStorage.removeItem("uploadedAudio");

        console.log("Created profile:", result.profile);
    } catch (error) {
        console.error(error);

        analysisStatus.textContent = "Profile creation failed";
        statusBadge.textContent = "Error";
        statusBadge.classList.remove("processing");
        statusBadge.classList.add("ready");

        profileMessage.classList.add("error-message");
        profileMessage.textContent = error.message;

        createProfileButton.disabled = false;
        createProfileButton.textContent = "Create Voice Profile";
    }
}