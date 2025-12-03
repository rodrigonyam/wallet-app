// Enhanced Mobile-optimized wallet application
// Main JavaScript file with advanced features

document.addEventListener('DOMContentLoaded', () => {
    // Existing elements
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

    // New enhanced elements
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importInput = document.getElementById('import-input');
    const exportModal = document.getElementById('export-modal');
    const confirmExportBtn = document.getElementById('confirm-export-btn');
    const cancelExportBtn = document.getElementById('cancel-export-btn');
    const includeImagesChk = document.getElementById('include-images');
    const includeMetadataChk = document.getElementById('include-metadata');
    const notification = document.getElementById('notification');
    const totalCardsSpan = document.getElementById('total-cards');
    const visibleCardsSpan = document.getElementById('visible-cards');
    const storageUsedSpan = document.getElementById('storage-used');

    let currentImageData = null;
    let currentFilter = '';
    let darkMode = localStorage.getItem('darkMode') === 'true';

    // Initialize theme
    initializeTheme();
    updateStats();

    // Enhanced Event Listeners
    
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

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        currentFilter = e.target.value.toLowerCase();
        clearSearchBtn.classList.toggle('hidden', !currentFilter);
        displaySavedCards();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentFilter = '';
        clearSearchBtn.classList.add('hidden');
        displaySavedCards();
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Import/Export functionality
    exportBtn.addEventListener('click', () => {
        exportModal.classList.remove('hidden');
    });

    importBtn.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', handleImport);

    confirmExportBtn.addEventListener('click', handleExport);
    
    cancelExportBtn.addEventListener('click', () => {
        exportModal.classList.add('hidden');
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
        let filteredCards = cards;

        // Apply search filter
        if (currentFilter) {
            filteredCards = cards.filter(card => 
                card.name.toLowerCase().includes(currentFilter)
            );
        }

        cardList.innerHTML = '';

        if (filteredCards.length === 0) {
            emptyState.classList.remove('hidden');
            if (currentFilter) {
                emptyState.innerHTML = `
                    <div class="empty-icon">🔍</div>
                    <p class="empty-title">No cards found</p>
                    <p class="empty-subtitle">Try adjusting your search terms</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <div class="empty-icon">💳</div>
                    <p class="empty-title">No cards saved yet</p>
                    <p class="empty-subtitle">Tap "Add Card" to get started</p>
                    <div class="quick-tips">
                        <h4>💡 Quick Tips:</h4>
                        <ul>
                            <li>Take photos in good lighting</li>
                            <li>Keep cards flat and centered</li>
                            <li>Use descriptive names</li>
                        </ul>
                    </div>
                `;
            }
            updateStats();
            return;
        }

        emptyState.classList.add('hidden');

        filteredCards.forEach(card => {
            const cardElement = createCardElement(card);
            cardList.appendChild(cardElement);
        });

        updateStats();
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

    // Enhanced Helper Functions

    function initializeTheme() {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        themeToggle.textContent = darkMode ? '☀️' : '🌙';
    }

    function toggleTheme() {
        darkMode = !darkMode;
        localStorage.setItem('darkMode', darkMode.toString());
        initializeTheme();
        showNotification(darkMode ? 'Dark mode enabled' : 'Light mode enabled');
    }

    function updateStats() {
        const cards = getAllCards();
        const visibleCards = cards.filter(card => !card.hidden);
        
        totalCardsSpan.textContent = cards.length;
        visibleCardsSpan.textContent = visibleCards.length;
        
        // Calculate storage usage (rough estimate)
        const storageUsed = JSON.stringify(cards).length;
        const storageLimit = 5 * 1024 * 1024; // 5MB rough limit
        const usagePercentage = Math.min(100, Math.round((storageUsed / storageLimit) * 100));
        storageUsedSpan.textContent = `${usagePercentage}%`;
        
        if (usagePercentage > 80) {
            storageUsedSpan.style.color = 'var(--danger-color)';
        } else if (usagePercentage > 60) {
            storageUsedSpan.style.color = 'var(--warning-color)';
        } else {
            storageUsedSpan.style.color = 'var(--success-color)';
        }
    }

    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    function handleExport() {
        const cards = getAllCards();
        const includeImages = includeImagesChk.checked;
        const includeMetadata = includeMetadataChk.checked;
        
        let exportData = {
            exportDate: new Date().toISOString(),
            version: '2.0',
            cardCount: cards.length,
            cards: cards.map(card => ({
                id: card.id,
                name: card.name,
                hidden: card.hidden,
                createdAt: card.createdAt || new Date().toISOString(),
                ...(includeImages && { imageData: card.imageData }),
                ...(includeMetadata && { 
                    metadata: {
                        fileSize: card.imageData ? card.imageData.length : 0,
                        lastModified: card.lastModified || card.createdAt
                    }
                })
            }))
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `wallet-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        exportModal.classList.add('hidden');
        showNotification('Cards exported successfully!');
    }

    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (!importData.cards || !Array.isArray(importData.cards)) {
                    throw new Error('Invalid file format');
                }

                let imported = 0;
                importData.cards.forEach(card => {
                    if (card.name && (card.imageData || !card.imageData)) {
                        const newCard = {
                            id: generateId(),
                            name: card.name,
                            imageData: card.imageData || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNmM3NTdkIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+',
                            hidden: card.hidden || false,
                            createdAt: new Date().toISOString()
                        };
                        saveCard(newCard.name, newCard.imageData);
                        imported++;
                    }
                });

                displaySavedCards();
                showNotification(`Imported ${imported} cards successfully!`);
                
            } catch (error) {
                showNotification('Failed to import file. Please check the format.', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'f':
                case 'F':
                    e.preventDefault();
                    searchInput.focus();
                    break;
                case 'n':
                case 'N':
                    e.preventDefault();
                    startCamera();
                    break;
                case 'd':
                case 'D':
                    e.preventDefault();
                    toggleTheme();
                    break;
            }
        }
    });

    // PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button or notification
        showNotification('💡 Tip: You can install this app for easier access!', 'info');
    });

    // Initial call to display saved cards on load
    displaySavedCards();
});