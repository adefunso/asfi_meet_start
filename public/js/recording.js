// let mediaRecorder;
// let canvasStream;
const startButtonGroup = document.getElementById("startButtonGroup");
const stopButtonGroup = document.getElementById("stopButtonGroup");

async function startRecording() {
  try {

   
    // 1. Capture screen (with cursor)
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    // 2. Create a canvas to remove the cursor
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play(); // Required for canvas rendering

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const meetingId = document.getElementById("meetingId").value;
    if (!meetingId) {
      throw new Error("Meeting ID is required");
    }
    
    // Set canvas size = video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 3. Redraw video WITHOUT cursor
    function drawFrame() {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawFrame);
    }
    drawFrame();
    startButtonGroup.classList.toggle("hidden");
    stopButtonGroup.classList.toggle("hidden");
    // 4. Record canvas stream (no cursor)
    canvasStream = canvas.captureStream(30); // 30 FPS
    
    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    // mediaRecorder.onstop = async () => {
    //   const blob = new Blob(chunks, { type: 'video/webm' });
      
    //   // Create FormData and append the recording
    //   const formData = new FormData();
    //   formData.append('file', blob, 'recording.webm');
    //   formData.append('meetingId', meetingId)
      
    //    // Cleanup
    //    stream.getTracks().forEach(track => track.stop());
    //    canvasStream.getTracks().forEach(track => track.stop());
    //   try {
    //     // Send to your endpoint
    //     const response = await fetch('/uploadRecording', {
    //       method: 'POST',
    //       body: formData
    //     });
        
    //     if (response.ok) {
    //       console.log('Recording uploaded successfully');
    //       const result = await response.json();
    //       console.log('Server response:', result);
    //     } else {
    //       console.error('Upload failed:', response.statusText);
    //     }
    //   } catch (error) {
    //     console.error('Error uploading recording:', error);
    //   }
      
     
    // };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      
      // Cleanup
      stream.getTracks().forEach(track => track.stop());
      canvasStream.getTracks().forEach(track => track.stop());
    
      // Save file to local
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `recording-${meetingId}.webm`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    
      console.log('Recording downloaded locally.');
    };
    
    mediaRecorder.start();
    console.log("Recording started (no mouse cursor)!");

    // Update button states
    startRecord.disabled = true;
    stopRecord.disabled = false;

  } catch (error) {
    console.error("Error:", error);
    startRecord.disabled = false;
    stopRecord.disabled = true;
  }
}

function stopRecording() {
  if (mediaRecorder?.state !== 'inactive') {
    mediaRecorder?.stop();
    startButtonGroup.classList.toggle("hidden");
    stopButtonGroup.classList.toggle("hidden");
  }
}

// Button setup
const startRecord = document.getElementById("startRecord");

if(startRecord){
startRecord.addEventListener("click", startRecording);
}
const stopRecord = document.getElementById("stopRecord");

if(stopRecord){
stopRecord.addEventListener("click", stopRecording);
}

