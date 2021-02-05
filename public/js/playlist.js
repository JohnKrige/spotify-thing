const existingPl = document.querySelector('#existing-pl');
let existingPlaylistsReturned = {};

const playListToggle = (polarity) => {
    if(polarity === 'turnOn'){
        playlist.classList.toggle('invisible');
        window.scrollTo(0,0);
        body.classList.add('fullScreenView');
    } else {
        playlist.classList.toggle('invisible');
        window.scrollTo(0,0);
        body.classList.remove('fullScreenView');
    }
}

// Fetches the user's playlists
const returnPlaylists = async () => {
    const resp= await fetch('/playlists');
    const json = await resp.json();
    existingPlaylistsReturned = json;
    createPlDropdown(json);
}

// Adding option elements to the playlist dropdown (select) element
const createPlDropdown = (plObj) => {
    existingPl.innerHTML = '';
    const optionNew = document.createElement('option');
    optionNew.innerText = 'Select a playlist';
    existingPl.appendChild(optionNew);
    for(let pl in plObj){
        let newOption = document.createElement('option');
        newOption.setAttribute('value', plObj[pl].name);
        newOption.setAttribute('id', plObj[pl].id);
        newOption.innerText = plObj[pl].name;
        existingPl.appendChild(newOption);
    }
}

const addToExistingPlButton = document.querySelector('.pl-old-btn');

addToExistingPlButton.addEventListener('click', async e => {
    let plSelected = document.querySelector('#existing-pl');
    let plId = plSelected.options[plSelected.selectedIndex].id;
    let bodyPL = {};
    bodyPL.id = plId;
    bodyPL.uris = uris // this is a var stored in the recommend.js file

    const postToPl = await fetch('/addToExistingPl',{
        method: 'POST',
        body: JSON.stringify(bodyPL),
        headers: {
            'Content-Type': 'application/json',
          }
    });

    const json = await postToPl.json();
    if(json){
        resetPlaylistInputs();
        flashMessage('Songs added to playlist');
    }
    else{
        console.log('Whoopsy poopsy, something went wrong')
    }
});


const resetPlaylistInputs = () => {
    playlist.classList.toggle('invisible');
    window.scrollTo(0,0);
    body.classList.remove('fullScreenView');
    existingPl.selectedIndex = 0;
}

const newPlButton = document.querySelector('.pl-new-btn');

newPlButton.addEventListener('click', async e => {
    const newName = document.querySelector('.new-pl').value;
    const jsonObj = {}
    jsonObj.name = newName;
    const rdizzle = await fetch('/createPlaylist', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        body: JSON.stringify(jsonObj)
    });

    returnPlaylists();
    flashMessage('New playlist created');

    // const json = await response.json();

    newPlInput = document.querySelector('.new-pl');
    newPlInput.innerText = '';
    newPlInput.value = '';
});

const backBtn = document.querySelector('.back-from-playlists');

backBtn.addEventListener('click', e => {
    playListToggle('back');
});

returnPlaylists();


