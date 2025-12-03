// Mobile-optimized camera functionality
let currentStream = null;

function startCamera() {
    const video = document.getElementById('video');
    const cameraContainer = document.getElementById('camera-container');
    
    // Mobile-optimized camera constraints
    const constraints = {
        video: {
            facingMode: 'environment', // Use back camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            aspectRatio: { ideal: 16/9 }
        }
    };

    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera not supported on this device');
        return;
    }

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            currentStream = stream;
            video.srcObject = stream;
            cameraContainer.classList.remove('hidden');
            
            // Prevent screen from turning off during camera use
            if ('wakeLock' in navigator) {
                navigator.wakeLock.request('screen').catch(err => {
                    console.log('Wake lock failed:', err);
                });
            }
        })
        .catch(error => {
            console.error('Error accessing camera:', error);
            let message = 'Unable to access camera. ';
            
            if (error.name === 'NotAllowedError') {
                message += 'Please allow camera permission and try again.';
            } else if (error.name === 'NotFoundError') {
                message += 'No camera found on this device.';
            } else {
                message += 'Please check your camera settings.';
            }
            
            alert(message);
        });
}

function stopCamera() {
    const cameraContainer = document.getElementById('camera-container');
    
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    cameraContainer.classList.add('hidden');
}

function captureImage() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    if (!video.videoWidth || !video.videoHeight) {
        alert('Camera not ready. Please wait a moment and try again.');
        return null;
    }
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);
    
    // Convert to image data with higher quality for mobile
    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
    
    return imageData;
}