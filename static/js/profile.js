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

const savedProfilesGrid =
    document.getElementById("savedProfilesGrid");


/* -------------------------------------------------
   LOAD UPLOADED AUDIO INFORMATION
------------------------------------------------- */

const uploadedAudioJson =
    sessionStorage.getItem("uploadedAudio");

let uploadedAudio = null;

if (uploadedAudioJson) {
    try {
        uploadedAudio =
            JSON.parse(uploadedAudioJson);
    } catch (error) {
        console.error(
            "Could not read uploaded audio details:",
            error
        );
    }
}


if (!uploadedAudio) {

    if (analysisContent) {
        analysisContent.classList.add("hidden");
    }

    if (noAudioMessage) {
        noAudioMessage.classList.remove("hidden");
    }

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
        profileName.value =
            `${suggestedProfileName} Voice`;
    }
}


/* -------------------------------------------------
   CREATE VOICE PROFILE
------------------------------------------------- */

createProfileButton?.addEventListener(
    "click",
    createVoiceProfile
);


async function createVoiceProfile() {

    const name =
        profileName.value.trim();


    profileMessage.classList.remove(
        "error-message",
        "success-message-text"
    );


    if (!name) {

        profileMessage.classList.add(
            "error-message"
        );

        profileMessage.textContent =
            "Please enter a name for the voice profile.";

        profileName.focus();

        return;
    }


    if (!uploadedAudio) {

        profileMessage.classList.add(
            "error-message"
        );

        profileMessage.textContent =
            "The uploaded audio information could not be found.";

        return;
    }


    createProfileButton.disabled = true;

    createProfileButton.textContent =
        "Creating Profile...";


    analysisStatus.textContent =
        "Saving voice profile";

    statusBadge.textContent =
        "Processing";

    statusBadge.classList.remove(
        "ready",
        "complete"
    );

    statusBadge.classList.add(
        "processing"
    );


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

        const response =
            await fetch(
                "/api/voice-profiles",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(profileData)
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "The voice profile could not be created."
            );
        }


        analysisStatus.textContent =
            "Voice profile created";

        statusBadge.textContent =
            "Complete";

        statusBadge.classList.remove(
            "processing"
        );

        statusBadge.classList.add(
            "complete"
        );


        profileMessage.classList.add(
            "success-message-text"
        );

        profileMessage.textContent =
            `"${result.profile.name}" was created successfully.`;


        createProfileButton.textContent =
            "Profile Created";


        sessionStorage.removeItem(
            "uploadedAudio"
        );


        console.log(
            "Created profile:",
            result.profile
        );


        /*
         Refresh the saved profiles so the
         newly created profile appears instantly.
        */

        await loadSavedProfiles();


    } catch (error) {

        console.error(error);


        analysisStatus.textContent =
            "Profile creation failed";

        statusBadge.textContent =
            "Error";


        statusBadge.classList.remove(
            "processing"
        );

        statusBadge.classList.add(
            "ready"
        );


        profileMessage.classList.add(
            "error-message"
        );

        profileMessage.textContent =
            error.message;


        createProfileButton.disabled =
            false;

        createProfileButton.textContent =
            "Create Voice Profile";
    }
}


/* -------------------------------------------------
   LOAD SAVED VOICE PROFILES
------------------------------------------------- */

async function loadSavedProfiles() {

    if (!savedProfilesGrid) {
        return;
    }


    savedProfilesGrid.innerHTML = `
        <div class="profiles-loading">
            Loading your voice profiles...
        </div>
    `;


    try {

        const response =
            await fetch(
                "/api/voice-profiles"
            );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Voice profiles could not be loaded."
            );
        }


        renderSavedProfiles(
            result.profiles || []
        );


    } catch (error) {

        console.error(
            "Could not load voice profiles:",
            error
        );


        savedProfilesGrid.innerHTML = `
            <div class="profiles-empty">

                <h3>
                    Unable to load profiles
                </h3>

                <p>
                    Your saved voice profiles
                    could not be loaded right now.
                </p>

            </div>
        `;
    }
}


/* -------------------------------------------------
   DISPLAY SAVED PROFILES
------------------------------------------------- */

function renderSavedProfiles(profiles) {

    savedProfilesGrid.innerHTML = "";


    if (!profiles.length) {

        savedProfilesGrid.innerHTML = `
            <div class="profiles-empty">

                <div class="empty-profile-icon">
                    +
                </div>

                <h3>
                    No voice profiles yet
                </h3>

                <p>
                    Create your first voice profile
                    and it will appear here.
                </p>

                <a
                    href="/upload"
                    class="primary-link"
                >
                    Create Your First Voice
                </a>

            </div>
        `;

        return;
    }


    /*
     Only one preview should play at a time.
    */

    let currentAudio = null;
    let currentPreviewButton = null;


    profiles.forEach((profile) => {

        const card =
            document.createElement("article");


        card.className =
            "voice-profile-card";


        const profileNameText =
            profile.name ||
            "Unnamed Voice";


        const profileFormat =
            profile.format ||
            "Audio";


        const initial =
            profileNameText
                .charAt(0)
                .toUpperCase();


        /*
         Try the possible audio URL values
         returned by the backend.

         If none exist, use stored_name.
        */

        const previewUrl =
            profile.audio_url ||
            profile.preview_url ||
            profile.file_url ||
            (
                profile.stored_name
                    ? `/uploads/${encodeURIComponent(
                        profile.stored_name
                    )}`
                    : null
            );


        card.innerHTML = `
            <div class="voice-card-top">

                <div class="voice-avatar">
                    ${escapeHtml(initial)}
                </div>


                <button
                    type="button"
                    class="voice-preview-button"
                    title="Preview voice"
                    aria-label="Preview ${escapeHtml(profileNameText)}"
                    ${previewUrl ? "" : "disabled"}
                >
                    <span class="preview-icon">
                        ▶
                    </span>
                </button>

            </div>


            <div class="voice-profile-info">

                <h3>
                    ${escapeHtml(profileNameText)}
                </h3>

                <p>
                    ${escapeHtml(profileFormat)}
                    voice profile
                </p>

            </div>


            <div class="voice-preview-text">

                <span class="preview-dot"></span>

                Preview voice sample

            </div>


            <button
                type="button"
                class="profile-card-action"
            >
                <span>
                    Use Voice
                </span>

                <span aria-hidden="true">
                    →
                </span>
            </button>
        `;


        const previewButton =
            card.querySelector(
                ".voice-preview-button"
            );


        const useVoiceButton =
            card.querySelector(
                ".profile-card-action"
            );


        /* -----------------------------------------
           AUDIO PREVIEW
        ----------------------------------------- */

        if (previewUrl) {

            previewButton.addEventListener(
                "click",
                async (event) => {

                    event.stopPropagation();


                    /*
                     If this same preview is playing,
                     clicking again stops it.
                    */

                    if (
                        currentAudio &&
                        currentPreviewButton ===
                            previewButton &&
                        !currentAudio.paused
                    ) {

                        currentAudio.pause();

                        currentAudio.currentTime = 0;


                        previewButton.classList.remove(
                            "playing"
                        );


                        previewButton.innerHTML = `
                            <span class="preview-icon">
                                ▶
                            </span>
                        `;


                        currentAudio = null;

                        currentPreviewButton = null;

                        return;
                    }


                    /*
                     Stop another profile preview
                     if one is already playing.
                    */

                    if (currentAudio) {

                        currentAudio.pause();

                        currentAudio.currentTime = 0;


                        if (currentPreviewButton) {

                            currentPreviewButton
                                .classList.remove(
                                    "playing"
                                );


                            currentPreviewButton
                                .innerHTML = `
                                    <span class="preview-icon">
                                        ▶
                                    </span>
                                `;
                        }
                    }


                    const audio =
                        new Audio(previewUrl);


                    currentAudio =
                        audio;


                    currentPreviewButton =
                        previewButton;


                    try {

                        await audio.play();


                        previewButton
                            .classList.add(
                                "playing"
                            );


                        previewButton.innerHTML = `
                            <span class="preview-icon">
                                ❚❚
                            </span>
                        `;


                    } catch (error) {

                        console.error(
                            "Voice preview failed:",
                            error
                        );


                        previewButton
                            .classList.remove(
                                "playing"
                            );


                        previewButton.innerHTML = `
                            <span class="preview-icon">
                                !
                            </span>
                        `;


                        currentAudio = null;

                        currentPreviewButton = null;
                    }


                    /*
                     Return button back to Play
                     when audio finishes.
                    */

                    audio.addEventListener(
                        "ended",
                        () => {

                            previewButton
                                .classList.remove(
                                    "playing"
                                );


                            previewButton.innerHTML = `
                                <span class="preview-icon">
                                    ▶
                                </span>
                            `;


                            currentAudio = null;

                            currentPreviewButton = null;
                        }
                    );
                }
            );
        }


        /* -----------------------------------------
           USE VOICE
        ----------------------------------------- */

        useVoiceButton.addEventListener(
            "click",
            () => {

                const profileId =
                    profile.id;


                if (!profileId) {

                    console.error(
                        "Voice profile does not have an ID:",
                        profile
                    );

                    return;
                }


                /*
                 Stop preview before leaving page.
                */

                if (currentAudio) {

                    currentAudio.pause();

                    currentAudio = null;
                }


                window.location.href =
                    `/generate?profile=${encodeURIComponent(
                        profileId
                    )}`;
            }
        );


        savedProfilesGrid.appendChild(
            card
        );
    });
}


/* -------------------------------------------------
   SIMPLE HTML ESCAPING
------------------------------------------------- */

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* -------------------------------------------------
   INITIAL PAGE LOAD
------------------------------------------------- */

loadSavedProfiles();