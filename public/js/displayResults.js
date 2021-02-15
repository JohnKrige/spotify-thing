/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
const resultsContent = document.querySelector('.results-content');
const results = document.querySelector('.results');

const tracksObj = {};

// Function that displays the recommendation results to the dom
// response json obj fetched via the recommend.js file.
const displayResults = response => {
  resultsContent.innerHTML = '';
  results.classList.remove('invisible');
  results.classList.add('visible');
  response.tracksProcessed.forEach((track, i) => {
    tracksObj[i] = track;
    const div = document.createElement('div');
    div.setAttribute('class', `results-display-section display-section${i}`);

    div.innerHTML = `
        <div class="results-details">
            <div class="results-details-track">
                <p class="results-track-name">Track name:<p> 
                <p> ${track.name} </p>
                </div>
                <div class="results-details-artist">                
                <p class="results-artist-name">Artist(s):</p>
                <p> ${track.artists.toString()} </p>
            </div>
        </div>
       `;

    // This is a play button and dropdown for each song, originally added to the display section above.
    // <div class="results-play-sample">
    //     <img class="recommend-btn" src="../imgs/play-button.svg" alt="play sample button" track="${i}">
    // </div>
    //    <div class="results-options">
    //         <img class="recommend-btn recommend-track-options" src="../imgs/drop-down.svg" alt="dropdown options for result track" track="${i}">
    //         <div class="song-dropdown-options invisible">
    //             <li>Add to playlist</li>
    //             <li>Open in browser</li>
    //             <li>Play on phone</li>
    //             <li>Remove from list</li>
    //         </div>
    //     </div>

    resultsContent.appendChild(div);
  });

  // playButtonListeners();
  // menuButtonListeners();
};

const noResultsDisplay = () => {
  resultsContent.innerHTML = '';
  results.classList.remove('invisible');
  results.classList.add('visible');
  const p = document.createElement('p');
  p.setAttribute('class', 'result-not-found');
  p.innerText = 'No results found';
  resultsContent.appendChild(p);
  window.scrollTo(0, 0);
};

// Event listener for playback sound
const playButtonListeners = () => {
  const playButtons = document.querySelectorAll('.recommend-play-sample-btn');
  playButtons.forEach(button => {
    button.addEventListener('click', e => {
      const track = button.getAttribute('track');
      const sample = tracksObj[track].preview_url;
      playSound(sample);
    });
  });
};

function playSound(url) {
  const a = new Audio(url);
  a.play();
}

// Open and close track options menu
const menuButtonListeners = () => {
  const trackOptions = document.querySelectorAll('.results-options');
  trackOptions.forEach(option => {
    const dropDown = option.querySelector('.song-dropdown-options');
    const dropDownBtn = option.querySelector('.recommend-track-options');
    dropDownBtn.addEventListener('click', e => {
      dropDown.classList.toggle('invisible');
    });
  });
};

menuButtonListeners();

// Add to playlist
const addToPlaylistButton = document.querySelector('.add-to-playlist');
const playlist = document.querySelector('.playlist-container');
const body = document.querySelector('body');
addToPlaylistButton.addEventListener('click', e => {
  // eslint-disable-next-line no-undef
  returnPlaylists();
  // eslint-disable-next-line no-undef
  playListToggle('turnOn');
});
