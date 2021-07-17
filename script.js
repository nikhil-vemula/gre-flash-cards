// Client ID and API key from the Developer Console
var CLIENT_ID = '846824791866-4h8s56si7qqtr1snbkk7nsolssica83o.apps.googleusercontent.com';
var API_KEY = 'AIzaSyATEltTRx4R09dTJnZNGq7NDjY99yYTQoc';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  }, function(error) {
    appendPre(JSON.stringify(error, null, 2));
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    loadData();
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

/* Misc */

function toggleControls() {
    var controlsContainer = document.getElementById("controlsContainer");
    if (controlsContainer.style.display == 'none') {
        controlsContainer.style.display = 'block';
    } else {
        controlsContainer.style.display ='none'
    }
}


/* ########################################################################### */

const isStorageAvailable = typeof(Storage) !== "undefined";
var greWords = [];

function loadData() {
    loadWords();
}

function loadWords() {
    greWords = getWords();
    renderFlashCards();
}

function getWords() {
    var words = [];
    if (isStorageAvailable) {
        var wordsFromStorage = getWordsFromStorage();
        if (wordsFromStorage && wordsFromStorage.length > 0) {
            console.log("Found in local storage");
            console.log('Word count: ' + wordsFromStorage.length);
            words = wordsFromStorage;
        } else {
            console.log("Not found in storage");
            loadWordsFromGoogleSheet();
        }
    } else {
        alert("Local storage not available");
    }
    return words;
}

function getWordsFromStorage() {
    var words = null;
    try {
        var wordsFromStorage = localStorage.getItem("gre_words");
        if (wordsFromStorage)
            words = JSON.parse(wordsFromStorage);
    } catch(e) {
        console.error(e);
    }
    return words;
}

function loadWordsFromGoogleSheet() {
    console.log("Getting words from google sheet....");
    var gregmat_sheet = "1Ul_AVmnc4v5Up9ZmP-5qzp1z_e8T7hi3vrm2tcG3FDs";
    var rangeInSheet = "Words!A2:D";
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: gregmat_sheet,
        range: rangeInSheet,
    }).then(function(response) {
        console.log("Fetched succesfully...");
        var range = response.result;
        var data = range.values;
        if (data.length > 0)
            saveWordsToStorage(data);
        else
            alert('No words found!!');
    }, function(response) {
        alert('Error fetching words');
    });
}

function saveWordsToStorage(words) {
    if (isStorageAvailable) {
        var dataToSave = [];

        for (var i = 0; i < words.length; i++) {
            var greWord = {};
            greWord.index = i;
            greWord.word = words[i][0];
            greWord.meaning = words[i][1];
            greWord.synonyms = words[i][2];
            greWord.antonyms = words[i][3];
            dataToSave.push(greWord);
        }
        localStorage.setItem('gre_words', JSON.stringify(dataToSave))
        console.log("Stored in local storage: word count:" + dataToSave.length);
        window.location.reload();
    }
}


/* Rendering cards */

var numberOfCardsToRender = 10;
var cardsToRender = [];
var currentSlide = getCurrentCardNumber();
var startWindow = currentSlide > 1 ? currentSlide - 1: 0;
var endWindow = startWindow + numberOfCardsToRender;
var mode = 'recall';

document.addEventListener('keydown', function (event) {
    if (event.code == 'KeyZ') {
        showPreviousCard();
    } else if (event.code == 'KeyX') {
        showNextCard();
    } else if (event.code == 'Space') {
        flipCard();
    }
});

window.onbeforeunload = function (e) {
    saveCurrentCardNumber();
};

function getCurrentCardNumber() {
    try {
        var num = localStorage.getItem('gre_current_word_number');
        console.log('Saved current: ' + num);
    } catch(e) {
        console.log(e);
    }
    return num ? parseInt(num) : 0;
}

function saveCurrentCardNumber() {
    debugger;
    try {
        localStorage.setItem('gre_current_word_number', currentSlide);
    } catch(e) {
        console.error(e);
    }
}

function renderFlashCards() {
    setCardsToRender(startWindow, endWindow);
    renderCards();
}

function setCardsToRender(startWindow, endWindow) {
    var selectCardsToRender = [];
    for (var i = startWindow; i <= endWindow; i++) {
        selectCardsToRender.push(greWords[i]);
    }
    cardsToRender = selectCardsToRender;
}

function renderCards() {
    var flashCardContainer = document.getElementById("flashCardContainer");
    flashCardContainer.innerHTML = "";
   for (var i = 0; i < cardsToRender.length; i++) {
       flashCardContainer.appendChild(createCard(cardsToRender[i]));
   }
   displayCard();
}

function displayCard() {
    var index = currentSlide;
    var allCards = document.querySelectorAll('.card');
    for (var i = 0; i < allCards.length; i++) {
        var card = allCards[i];
        var id = card.getAttribute("id");
        if (id == 'card-' + index) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    }
}

function createCard(greWord) {
    var card = document.createElement('div');
    card.setAttribute('class', 'card show-front');
    card.setAttribute('id', 'card-'+ greWord.index);
    card.style.display = 'none';

    var frontCard = document.createElement('div');
    frontCard.setAttribute('class', 'front-card');
    frontCard.innerText = greWord.word;
    card.appendChild(frontCard);

    var backCard = document.createElement('div');
    backCard.setAttribute('class', 'back-card');

    if (greWord.meaning) {
        var meaningElement = document.createElement('div');
        meaningElement.innerHTML = '<b>Meaning: </b>' + greWord.meaning;
        backCard.appendChild(meaningElement);
    } else {
        var noMearningElement = document.createElement('div');
        noMearningElement.innerHTML = '<b>No Meaning</b>';
        backCard.appendChild(noMearningElement);
    }
    
    if (greWord.synonyms) {
        var synonymsElement = document.createElement('div');
        synonymsElement.innerHTML = '<b>Synonyms: </b>' + greWord.synonyms;
        backCard.appendChild(synonymsElement);
    }

    if (greWord.antonyms) {
        var antonymsElement = document.createElement('div');
        antonymsElement.innerHTML = '<b>Antonymns: </b>' + greWord.antonyms;
        backCard.appendChild(antonymsElement);
    }

    card.appendChild(backCard);

    var cardControls = document.createElement('div');
    cardControls.setAttribute('class', 'card-controls');

    var previousCard = document.createElement("a");
    previousCard.href = "javascript: void(0)";
    previousCard.innerText = "previous";
    previousCard.setAttribute('class', 'control previous-card');
    previousCard.addEventListener('click', function(event) {
        showPreviousCard(card);
    })
    cardControls.appendChild(previousCard);

    var showCard = document.createElement("a");
    showCard.href = "javascript: void(0)";
    showCard.innerText = "show";
    showCard.setAttribute('class', 'control show-card');
    showCard.addEventListener('click', function(event) {
        flipCard(card);
    })
    cardControls.appendChild(showCard);

    var nextCard = document.createElement("a");
    nextCard.href = "javascript: void(0)";
    nextCard.innerText = "next";
    nextCard.setAttribute('class', 'control next-card');
    nextCard.addEventListener('click', function(event) {
        showNextCard(card);
    })
    cardControls.appendChild(nextCard);

    card.appendChild(cardControls);

    var cardNumberElement = document.createElement('div');
    cardNumberElement.setAttribute('class', 'card-number');
    cardNumberElement.style.fontSize = 'large';
    cardNumberElement.innerText = parseInt(greWord.index) + 1;
    card.appendChild(cardNumberElement);

    return card;
}


function showPreviousCard() {
    if (mode != 'recall')
        return;
    
    currentSlide = currentSlide - 1 > 0 ? currentSlide - 1 : 0;

    if (startWindow != 0 && currentSlide  < startWindow + 1) {
        console.log("Remove card to render");
        var numberOfCardsToFetch = numberOfCardsToRender - 3;
        endWindow = endWindow - numberOfCardsToFetch + 1;
        startWindow = endWindow - numberOfCardsToRender;
        
        if (startWindow < 0) {
            startWindow = 0;
        }

        setCardsToRender(startWindow, endWindow);
        renderCards();
    }

    displayCard();
}

function flipCard(cardElement) {
    cardElement = cardElement || document.getElementById('card-'+ currentSlide);
    var className = cardElement.getAttribute('class');
    
    if (className == 'card show-front') {
        cardElement.setAttribute('class', 'card show-back');
    } else {
        cardElement.setAttribute('class', 'card show-front');
    }
}

function showNextCard() {

    if (mode != 'recall')
        return;

    currentSlide = currentSlide + 1 < endWindow ? currentSlide + 1 : endWindow;

    if (currentSlide  == endWindow - 1) {
        console.log("Add more card to render...");
        var numberOfCardsToFetch = numberOfCardsToRender - 3;
        startWindow = startWindow + numberOfCardsToFetch;
        endWindow = startWindow + numberOfCardsToRender;
        
        if (endWindow > greWords.length) {
            endWindow = greWords.length;
        }

        setCardsToRender(startWindow, endWindow);
        renderCards();
    }

    displayCard();
}

function goToWord(cardNumber) {
    var cardIndex = cardNumber - 1;
    cardIndex = cardIndex < 0 ? 0 : cardIndex;
    startWindow = cardIndex;
    endWindow = startWindow + numberOfCardsToRender;
    setCardsToRender(startWindow, endWindow);
    renderCards();
    currentSlide = cardIndex;
    displayCard();
}