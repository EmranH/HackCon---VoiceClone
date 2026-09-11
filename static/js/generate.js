const generateForm =
    document.getElementById("generate-form");

const voiceProfileSelect =
    document.getElementById("voice-profile");

const speechTextInput =
    document.getElementById("speech-text");

const generateButton =
    document.getElementById("generate-button");

const progressWrapper =
    document.getElementById("progress-wrapper");

const progressSection =
    document.getElementById("progress-section");

const progressBar =
    document.getElementById("progress-bar");

const progressStatus =
    document.getElementById("progress-status");

const progressPercentage =
    document.getElementById("progress-percentage");

const elapsedTime =
    document.getElementById("elapsed-time");

const generationStatus =
    document.getElementById("generation-status");

const audioResult =
    document.getElementById("audio-result");

const generatedAudio =
    document.getElementById("generated-audio");

const downloadLink =
    document.getElementById("download-link");


let progressTimer = null;
let elapsedInterval = null;


/* ---------------------------------------
   LOAD SAVED VOICE PROFILES
--------------------------------------- */

async function loadVoiceProfiles() {

    if (!voiceProfileSelect) {
        return;
    }

    voiceProfileSelect.innerHTML =
        `<option value="">Loading voice profiles...</option>`;

    voiceProfileSelect.disabled = true;

    try {

        const response =
            await fetch("/api/voice-profiles");

        const result =
            await response.json();


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Voice profiles could not be loaded."
            );
        }


        const profiles =
            result.profiles || [];


        voiceProfileSelect.innerHTML = "";


        const defaultOption =
            document.createElement("option");

        defaultOption.value = "";

        defaultOption.textContent =
            profiles.length
                ? "Select a voice profile"
                : "No voice profiles available";

        voiceProfileSelect.appendChild(
            defaultOption
        );


        if (!profiles.length) {

            voiceProfileSelect.disabled = true;

            return;
        }


        profiles.forEach((profile) => {

            const option =
                document.createElement("option");

            option.value =
                profile.id;

            option.textContent =
                profile.format
                    ? `${profile.name} (${profile.format})`
                    : profile.name;

            voiceProfileSelect.appendChild(
                option
            );
        });


        voiceProfileSelect.disabled = false;


        /*
         If the user clicked a profile from
         the Profiles page, automatically
         select that voice here.
        */

        const params =
            new URLSearchParams(
                window.location.search
            );

        const selectedProfileId =
            params.get("profile");


        if (selectedProfileId) {

            const optionExists =
                Array.from(
                    voiceProfileSelect.options
                ).some(
                    option =>
                        option.value ===
                        selectedProfileId
                );


            if (optionExists) {

                voiceProfileSelect.value =
                    selectedProfileId;
            }
        }


    } catch (error) {

        console.error(error);

        voiceProfileSelect.innerHTML =
            `<option value="">
                Failed to load voice profiles
            </option>`;

        voiceProfileSelect.disabled = true;

        generationStatus.textContent =
            error.message;
    }
}


/* ---------------------------------------
   GENERATION PROGRESS
--------------------------------------- */

function beginProgress() {

    progressWrapper.hidden = false;

    let seconds = 0;


    elapsedTime.textContent =
        "Elapsed: 00:00";


    elapsedInterval =
        window.setInterval(() => {

            seconds++;


            const mins =
                String(
                    Math.floor(seconds / 60)
                ).padStart(2, "0");


            const secs =
                String(
                    seconds % 60
                ).padStart(2, "0");


            elapsedTime.textContent =
                `Elapsed: ${mins}:${secs}`;

        }, 1000);


    const stages = [

        {
            percentage: 10,
            message:
                "Preparing generation request..."
        },

        {
            percentage: 25,
            message:
                "Loading the selected voice..."
        },

        {
            percentage: 40,
            message:
                "Preparing the Chatterbox model..."
        },

        {
            percentage: 60,
            message:
                "Analysing the reference voice..."
        },

        {
            percentage: 75,
            message:
                "Generating cloned speech..."
        },

        {
            percentage: 90,
            message:
                "Still generating — please keep this page open..."
        }

    ];


    let stageIndex = 0;


    progressSection.hidden = false;

    progressBar.style.width =
        "5%";

    progressPercentage.textContent =
        "5%";

    progressStatus.textContent =
        "Preparing...";

    generationStatus.textContent =
        "Preparing generation request...";


    progressTimer =
        window.setInterval(() => {

            if (
                stageIndex >=
                stages.length
            ) {

                window.clearInterval(
                    progressTimer
                );

                progressTimer = null;

                return;
            }


            const stage =
                stages[stageIndex];


            progressBar.style.width =
                `${stage.percentage}%`;

            progressPercentage.textContent =
                `${stage.percentage}%`;

            progressStatus.textContent =
                stage.message;

            generationStatus.textContent =
                stage.message;


            stageIndex++;

        }, 2500);
}


/* ---------------------------------------
   FINISH PROGRESS
--------------------------------------- */

function finishProgress(success) {

    if (progressTimer !== null) {

        clearInterval(progressTimer);

        progressTimer = null;
    }


    if (elapsedInterval !== null) {

        clearInterval(elapsedInterval);

        elapsedInterval = null;
    }


    if (success) {

        progressBar.style.width =
            "100%";

        progressPercentage.textContent =
            "100%";

        progressStatus.textContent =
            "Speech generated successfully!";

        generationStatus.textContent =
            "Speech generated successfully!";

    } else {

        progressBar.style.width =
            "0%";

        progressPercentage.textContent =
            "0%";

        progressStatus.textContent =
            "Generation failed.";
    }
}


/* ---------------------------------------
   GENERATE SPEECH
--------------------------------------- */

generateForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const profileId =
            voiceProfileSelect.value;


        const text =
            speechTextInput.value.trim();


        if (!profileId || !text) {

            generationStatus.textContent =
                "Please select a voice and enter some text.";

            return;
        }


        generateButton.disabled = true;

        generateButton.textContent =
            "Generating...";


        voiceProfileSelect.disabled =
            true;

        speechTextInput.disabled =
            true;


        audioResult.hidden =
            true;


        generationStatus.textContent =
            "";


        beginProgress();


        try {

            const response =
                await fetch(
                    "/api/generate-speech",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                profile_id:
                                    profileId,

                                text:
                                    text
                            })
                    }
                );


            const responseText =
                await response.text();


            let result;


            try {

                result =
                    JSON.parse(
                        responseText
                    );

            } catch {

                console.error(
                    "Non-JSON server response:",
                    responseText
                );


                throw new Error(
                    `Server error (${response.status}). Check the Flask terminal.`
                );
            }


            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Speech generation failed."
                );
            }


            const audioUrl =
                `${result.audio.url}?t=${Date.now()}`;


            generatedAudio.src =
                audioUrl;


            downloadLink.href =
                result.audio.url;


            downloadLink.download =
                result.audio.filename;


            audioResult.hidden =
                false;


            finishProgress(true);


        } catch (error) {

            console.error(error);


            finishProgress(false);


            generationStatus.textContent =
                error.message ||
                "Speech generation failed.";


        } finally {

            generateButton.disabled =
                false;


            generateButton.textContent =
                "Generate Speech";


            voiceProfileSelect.disabled =
                false;


            speechTextInput.disabled =
                false;
        }
    }
);


/* ---------------------------------------
   START PAGE
--------------------------------------- */

loadVoiceProfiles();