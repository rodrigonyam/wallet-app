function openCamera() {
    const constraints = {
        video: {
            facingMode: 'environment'
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            document.body.appendChild(video);

            const captureButton = document.createElement('button');
            captureButton.innerText = 'Capture';
            document.body.appendChild(captureButton);

            captureButton.addEventListener('click', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/png');

                // Stop the video stream
                stream.getTracks().forEach(track => track.stop());
                video.remove();
                captureButton.remove();

                // Process the captured image (e.g., save it)
                processCapturedImage(imageData);
            });
        })
        .catch(error => {
            console.error('Error accessing the camera: ', error);
        });
}

function processCapturedImage(imageData) {
    // Here you can implement the logic to save the image data
    // For example, you can call a function from storage.js to save the image
    console.log('Captured Image Data:', imageData);
    // storage.saveImage(imageData); // Uncomment this line when storage.js is implemented
}