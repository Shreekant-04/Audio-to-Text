document
  .getElementById("transcription-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const apiKey = "d923e7fa46d64719a2751e16852532fd"; // Replace with your actual API key
    const audioUrlInput = document.getElementById("audio-url");
    const audioFileInput = document.getElementById("audio-file");
    const resultText = document.getElementById("transcription-text");

    resultText.textContent = "Transcribing... Please wait.";

    try {
      let audioUrlToTranscribe;

      if (audioFileInput.files.length > 0) {
        // Upload the local file
        const formData = new FormData();
        formData.append("file", audioFileInput.files[0]);

        const uploadResponse = await fetch(
          "https://api.assemblyai.com/v2/upload",
          {
            method: "POST",
            headers: {
              authorization: apiKey,
            },
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();
        audioUrlToTranscribe = uploadData.upload_url;
      } else if (audioUrlInput.value) {
        audioUrlToTranscribe = audioUrlInput.value;
      } else {
        resultText.textContent =
          "Please provide an audio file URL or upload a local file.";
        return;
      }

      // Transcribe the audio file
      const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({ audio_url: audioUrlToTranscribe }),
      });

      const data = await response.json();
      const transcriptId = data.id;

      let transcriptResult;
      while (true) {
        const resultResponse = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            method: "GET",
            headers: {
              authorization: apiKey,
            },
          }
        );
        transcriptResult = await resultResponse.json();

        if (transcriptResult.status === "completed") {
          break;
        } else if (transcriptResult.status === "failed") {
          resultText.textContent = "Transcription failed. Please try again.";
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking the status again
      }

      resultText.textContent = transcriptResult.text;
    } catch (error) {
      resultText.textContent =
        "An error occurred while transcribing. Please try again.";
      console.error(error);
    }

    // Clear the form after submission
    audioUrlInput.value = "";
    audioFileInput.value = "";
  });
