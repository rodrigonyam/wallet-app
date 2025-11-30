function saveCardImage(cardImage) {
    let cardImages = JSON.parse(localStorage.getItem('cardImages')) || [];
    cardImages.push(cardImage);
    localStorage.setItem('cardImages', JSON.stringify(cardImages));
}

function getCardImages() {
    return JSON.parse(localStorage.getItem('cardImages')) || [];
}

function deleteCardImage(index) {
    let cardImages = JSON.parse(localStorage.getItem('cardImages')) || [];
    if (index > -1 && index < cardImages.length) {
        cardImages.splice(index, 1);
        localStorage.setItem('cardImages', JSON.stringify(cardImages));
    }
}