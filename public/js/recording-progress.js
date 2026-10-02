        let mediaRecorder;
        let recordedChunks = [];

        document.getElementById("startRecord").addEventListener("click", async function () {
            const iframe = document.getElementById("roomContainer");
            
            try {
                const stream = await iframe.contentWindow.document.querySelector("video").captureStream();
                
                mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
                mediaRecorder.ondataavailable = function (event) {
                    if (event.data.size > 0) recordedChunks.push(event.data);
                };
                
                mediaRecorder.onstop = function () {
                    const blob = new Blob(recordedChunks, { type: "video/webm" });
                    const url = URL.createObjectURL(blob);
                    
                    const downloadLink = document.getElementById("downloadLink");
                    downloadLink.href = url;
                    downloadLink.download = "recorded-video.webm";
                    downloadLink.style.display = "block";
                    downloadLink.innerText = "Download Video";
                };

                mediaRecorder.start();
                document.getElementById("startRecord").disabled = true;
                document.getElementById("stopRecord").disabled = false;

            } catch (error) {
                console.error("Error capturing iframe:", error);
                alert("Recording not possible due to cross-origin restrictions.");
            }
        });

        document.getElementById("stopRecord").addEventListener("click", function () {
            mediaRecorder.stop();
            document.getElementById("stopRecord").disabled = true;
        });