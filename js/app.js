// Main JavaScript file for the wallet application

document.addEventListener('DOMContentLoaded', () => {
    const captureButton = document.getElementById('capture-button');
    const cardList = document.getElementById('card-list');

    captureButton.addEventListener('click', () => {
        // Function to capture image of credit card
        captureImage();
    });

    function captureImage() {
        // Logic to access camera and capture image
        // This will call a function from camera.js
        // Placeholder for camera functionality
        console.log('Capture image function called');
    }

    function displaySavedCards() {
        // Logic to retrieve and display saved cards
        // This will call a function from storage.js
        console.log('Display saved cards function called');
    }

    // Initial call to display saved cards on load
    displaySavedCards();
});
// Main JavaScript file for the wallet application

document.addEventListener('DOMContentLoaded', () => {
    const addCardBtn = document.getElementById('add-card-btn');
    const showAllBtn = document.getElementById('show-all-btn');
    const hideAllBtn = document.getElementById('hide-all-btn');
    const cardList = document.getElementById('card-list');
    const emptyState = document.getElementById('empty-state');
    const cameraContainer = document.getElementById('camera-container');
    const captureBtn = document.getElementById('capture-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const cardNameModal = document.getElementById('card-name-modal');
    const cardNameInput = document.getElementById('card-name-input');
    const saveCardBtn = document.getElementById('save-card-btn');
    const cancelNameBtn = document.getElementById('cancel-name-btn');

    let currentImageData = null;

    // Menu button handlers
    addCardBtn.addEventListener('click', () => {
        startCamera();
    });

    showAllBtn.addEventListener('click', () => {
        showAllCards();
    });

    hideAllBtn.addEventListener('click', () => {
        hideAllCards();
    });

    // Camera handlers
    captureBtn.addEventListener('click', () => {
        currentImageData = captureImage();
        if (currentImageData) {
            stopCamera();
            showNameModal();
        }
    });

    cancelBtn.addEventListener('click', () => {
        stopCamera();
    });

    // Modal handlers
    saveCardBtn.addEventListener('click', () => {
        const cardName = cardNameInput.value.trim();
        if (cardName && currentImageData) {
            saveCard(cardName, currentImageData);
            hideNameModal();
            cardNameInput.value = '';
            currentImageData = null;
            displaySavedCards();
        } else {
            alert('Please enter a card name');
        }
    });

    cancelNameBtn.addEventListener('click', () => {
        hideNameModal();
        cardNameInput.value = '';
        currentImageData = null;
    });

    function showNameModal() {
        cardNameModal.classList.remove('hidden');
        cardNameInput.focus();
    }

    function hideNameModal() {
        cardNameModal.classList.add('hidden');
    }

    function displaySavedCards() {
        const cards = getAllCards();
        cardList.innerHTML = '';

        if (cards.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        cards.forEach(card => {
            const cardElement = createCardElement(card);
            cardList.appendChild(cardElement);
        });
    }

    function createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card-item ${card.hidden ? 'hidden-card' : ''}`;
        cardDiv.dataset.id = card.id;

        cardDiv.innerHTML = `
            <img src="${card.imageData}" alt="${card.name}" class="card-image">
            <div class="card-info">
                <div class="card-name">${card.name}</div>
                <div class="card-actions">
                    <button class="toggle-btn" onclick="toggleCardVisibility('${card.id}')">
                        ${card.hidden ? '👁️ Show' : '🙈 Hide'}
                    </button>
                    <button class="delete-btn" onclick="deleteCard('${card.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;

        return cardDiv;
    }

    function showAllCards() {
        const cards = getAllCards();
        cards.forEach(card => {
            card.hidden = false;
            updateCard(card);
        });
        displaySavedCards();
    }

    function hideAllCards() {
        const cards = getAllCards();
        cards.forEach(card => {
            card.hidden = true;
            updateCard(card);
        });
        displaySavedCards();
    }

    // Make functions globally accessible
    window.toggleCardVisibility = (cardId) => {
        toggleCard(cardId);
        displaySavedCards();
    };

    window.deleteCard = (cardId) => {
        if (confirm('Are you sure you want to delete this card?')) {
            removeCard(cardId);
            displaySavedCards();
        }
    };

    // Initial call to display saved cards on load
    displaySavedCards();
});