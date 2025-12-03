// Enhanced storage functionality for mobile wallet app

function saveCard(name, imageData) {
    const cards = getAllCards();
    const newCard = {
        id: generateId(),
        name: name,
        imageData: imageData,
        dateAdded: new Date().toISOString(),
        hidden: false
    };
    
    cards.push(newCard);
    localStorage.setItem('walletCards', JSON.stringify(cards));
    
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
        cards[index] = updatedCard;
        localStorage.setItem('walletCards', JSON.stringify(cards));
        return true;
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

// Check storage usage (mobile devices have limited storage)
function getStorageInfo() {
    try {
        const cards = getAllCards();
        const storageSize = JSON.stringify(cards).length;
        
        return {
            cardCount: cards.length,
            storageSize: storageSize,
            storageSizeMB: (storageSize / (1024 * 1024)).toFixed(2)
        };
    } catch (error) {
        console.error('Error getting storage info:', error);
        return { cardCount: 0, storageSize: 0, storageSizeMB: '0.00' };
    }
}