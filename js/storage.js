// Enhanced storage functionality for mobile wallet app

function saveCard(name, imageData) {
    const cards = getAllCards();
    const newCard = {
        id: generateId(),
        name: name,
        imageData: imageData,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        hidden: false,
        metadata: {
            fileSize: imageData.length,
            compressed: true,
            version: '2.0'
        }
    };
    
    cards.push(newCard);
    try {
        localStorage.setItem('walletCards', JSON.stringify(cards));
        localStorage.setItem('walletLastUpdate', new Date().toISOString());
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            // Storage quota exceeded, try cleanup
            cleanupStorage();
            throw new Error('Storage quota exceeded. Please delete some cards.');
        }
        throw error;
    }
    
    return newCard;
}

function getAllCards() {
    try {
        return JSON.parse(localStorage.getItem('walletCards')) || [];
    } catch (error) {
        console.error('Error reading cards from storage:', error);
        return [];
    }
}

function getCardById(cardId) {
    const cards = getAllCards();
    return cards.find(card => card.id === cardId);
}

function updateCard(updatedCard) {
    const cards = getAllCards();
    const index = cards.findIndex(card => card.id === updatedCard.id);
    
    if (index !== -1) {
        updatedCard.lastModified = new Date().toISOString();
        cards[index] = updatedCard;
        
        try {
            localStorage.setItem('walletCards', JSON.stringify(cards));
            localStorage.setItem('walletLastUpdate', new Date().toISOString());
            return true;
        } catch (error) {
            console.error('Error updating card:', error);
            return false;
        }
    }
    
    return false;
}

function removeCard(cardId) {
    const cards = getAllCards();
    const filteredCards = cards.filter(card => card.id !== cardId);
    
    localStorage.setItem('walletCards', JSON.stringify(filteredCards));
    return true;
}

function toggleCard(cardId) {
    const card = getCardById(cardId);
    if (card) {
        card.hidden = !card.hidden;
        updateCard(card);
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Storage cleanup and optimization
function cleanupStorage() {
    try {
        const cards = getAllCards();
        // Remove cards older than 1 year if storage is getting full
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const recentCards = cards.filter(card => {
            const cardDate = new Date(card.dateAdded);
            return cardDate > oneYearAgo;
        });
        
        if (recentCards.length < cards.length) {
            localStorage.setItem('walletCards', JSON.stringify(recentCards));
        }
    } catch (error) {
        console.error('Error during storage cleanup:', error);
    }
}

// Enhanced storage management functions
function getStorageInfo() {
    try {
        const cards = getAllCards();
        const storageSize = JSON.stringify(cards).length;
        const visibleCards = cards.filter(card => !card.hidden);
        
        return {
            cardCount: cards.length,
            visibleCount: visibleCards.length,
            storageSize: storageSize,
            storageSizeMB: (storageSize / (1024 * 1024)).toFixed(2),
            lastUpdate: localStorage.getItem('walletLastUpdate'),
            averageCardSize: cards.length > 0 ? Math.round(storageSize / cards.length) : 0
        };
    } catch (error) {
        console.error('Error getting storage info:', error);
        return { 
            cardCount: 0, 
            visibleCount: 0,
            storageSize: 0, 
            storageSizeMB: '0.00',
            lastUpdate: null,
            averageCardSize: 0
        };
    }
}

// Export all data
function exportAllData() {
    const cards = getAllCards();
    const storageInfo = getStorageInfo();
    
    return {
        version: '2.0',
        exportDate: new Date().toISOString(),
        storageInfo: storageInfo,
        cards: cards
    };
}

// Import data with validation
function importData(data) {
    if (!data || !data.cards || !Array.isArray(data.cards)) {
        throw new Error('Invalid import data format');
    }
    
    const validCards = data.cards.filter(card => 
        card.name && 
        card.imageData && 
        typeof card.name === 'string' &&
        typeof card.imageData === 'string'
    );
    
    if (validCards.length === 0) {
        throw new Error('No valid cards found in import data');
    }
    
    // Add metadata if missing
    const processedCards = validCards.map(card => ({
        ...card,
        id: card.id || generateId(),
        createdAt: card.createdAt || card.dateAdded || new Date().toISOString(),
        lastModified: card.lastModified || card.createdAt || new Date().toISOString(),
        hidden: card.hidden || false,
        metadata: card.metadata || {
            fileSize: card.imageData.length,
            compressed: true,
            version: '2.0',
            imported: true
        }
    }));
    
    try {
        localStorage.setItem('walletCards', JSON.stringify(processedCards));
        localStorage.setItem('walletLastUpdate', new Date().toISOString());
        return processedCards.length;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            throw new Error('Not enough storage space for import');
        }
        throw error;
    }
}

// Performance monitoring
function getPerformanceMetrics() {
    const startTime = performance.now();
    const cards = getAllCards();
    const loadTime = performance.now() - startTime;
    
    return {
        loadTime: Math.round(loadTime * 100) / 100,
        cardCount: cards.length,
        memoryUsage: navigator.deviceMemory || 'unknown'
    };
}