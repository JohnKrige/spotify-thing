// Home screen before login, set the height of the body container to fill the screen
const header = document.querySelector('header');
const homeLoginBody = document.querySelector('.home-login-container');

const windowHeight = window.innerHeight;
headerHeight = header.offsetHeight;

// 100px = margin top and bottom of container. 
remainingHeight = windowHeight - headerHeight -100;

if(homeLoginBody){
    homeLoginBody.style.height = `${remainingHeight}px`;
}

// Top tracks and artists margin
const topButtonsWidth = document.querySelector('.top-listens-button').offsetWidth * 2;
const windowWidth = window.innerWidth;
marginBetweenButtons = (windowWidth - topButtonsWidth) / 3 ;

const artistButton = document.querySelector('.top-listens-button__artists');
artistButton.style.marginRight = `${marginBetweenButtons}px`;


const closeFlash = document.querySelector('.flash-message-close-button');
const flashMessageDisplay = document.querySelector('.flash-message');

closeFlash.addEventListener('click', e => {
    flashMessageDisplay.classList.toggle('invisible');
});

const userDropdown = document.querySelector('.user-dropdown-img');
const logout = document.querySelector('.user-dropdown-logout-select');

let dropDownOpen = false;

userDropdown.addEventListener('click', e => {
    logout.classList.toggle('invisible');
    toggleMenuImage();
    dropDownOpen = !dropDownOpen;
    window.addEventListener('click', hideMenu);
});

const hideMenu = (e) => {
    if(e.target.getAttribute('class') !== 'user-dropdown-logout-select' && e.target.getAttribute('class') !== 'user-dropdown-img'){
        logout.classList.add('invisible');
        window.removeEventListener('click',hideMenu);
    };
}

const toggleMenuImage = () => {
    let img = document.querySelector('.user-dropdown-img');
    if(dropDownOpen){
        img.setAttribute('src','../imgs/down-arrow.svg');
    } else {
        img.setAttribute('src','../imgs/up-arrow.svg');
    }
}

const flashText = document.querySelector('.flash-message-text');

const flashMessage = (message) => {
    flashMessageDisplay.classList.toggle('invisible');
    flashText.innerHTML = message;
    window.scrollTo(0,0);
    removeFlashMessage();
}

let apple; 

const removeFlashMessage = () => {
    let timeout = setTimeout( function(){
        apple = flashMessageDisplay.classList.add('invisible');
        flashText.innerHTML = '';
    }, 
    5000);
}

// let polarity = 'off'

const helpButton = document.querySelector('.recommendation-help');
const help = document.querySelector('.help');
helpButton.addEventListener('click', e => {
    help.classList.remove('invisible');
    body.classList.add('fullScreenView');
});

const helpBack = document.querySelector('.help-back');
helpBack.addEventListener('click', e => {
    help.classList.add('invisible');
    body.classList.remove('fullScreenView');
});

const refreshModal = document.querySelector('.refresh-token');
const refreshModalButton = document.querySelector('.token-refresh-btn');

refreshModalButton.addEventListener('click', e => {
    refreshModal.classList.add('invisible');
});

const promptTokenRefresh = () => {
    refreshModal.classList.remove('invisible');
};






