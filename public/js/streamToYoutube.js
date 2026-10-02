let mediaRecorder;
let canvasStream;
let ws;
const startStreamGroup = document.getElementById("startStreamGroup");
const stopStreamGroup = document.getElementById("stopStreamGroup");

async function startStreaming() {
  try {
    // Request screen media with both video and audio
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: true,
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();

    // Create a canvas to capture frames and send to WebSocket
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    function drawFrame() {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawFrame);
    }
    drawFrame();

    startStreamGroup.classList.toggle("hidden");
    stopStreamGroup.classList.toggle("hidden");

    canvasStream = canvas.captureStream(30); // Capture at 30 FPS

    // Preferred format: MP4 with H.264 codec
    const mimeTypes = [
      'video/mp4; codecs=avc1.42E01E', // H.264 codec (MP4)
      'video/webm; codecs=vp8', // Fallback: WebM VP8 codec
      'video/webm; codecs=vp9', // Fallback: WebM VP9 codec
    ];

    // Check which mime type is supported by the browser
    let supportedType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));

    if (!supportedType) {
      console.error("No supported MediaRecorder format available.");
      return;
    }

    // Use MediaRecorder to record the canvas stream in the supported format
    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: supportedType });

    // Create a WebSocket connection to send the video data to the backend
    ws = new WebSocket('ws://localhost:5000'); // Change the WebSocket server URL as needed

    ws.onopen = () => console.log("WebSocket connected");

    ws.onerror = (err) => console.error("WebSocket error:", err);

    // Send recorded video data to the WebSocket server when available
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(event.data); // Send the MP4 or WebM data to the server
      }
    };

    // Start recording and sending data every second
    mediaRecorder.start(1000); // Send data every second (adjustable)
    console.log("Streaming started!");

  } catch (error) {
    console.error("Error:", error);
  }
}

function stopStreaming() {
  if (mediaRecorder?.state !== 'inactive') {
    mediaRecorder.stop();
    canvasStream.getTracks().forEach(track => track.stop());
    ws.close();
    console.log("Streaming stopped!");
    startStreamGroup.classList.toggle("hidden");
    stopStreamGroup.classList.toggle("hidden");
  }
}

if(document.getElementById("startStream")){
document.getElementById("startStream").addEventListener("click", startStreaming);
}

if(document.getElementById("stopStream")){
document.getElementById("stopStream").addEventListener("click", stopStreaming);
}