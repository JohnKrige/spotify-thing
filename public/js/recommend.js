/* eslint-disable no-console */
/* eslint-disable no-useless-return */
/* eslint-disable no-else-return */
/* eslint-disable radix */
/* eslint-disable guard-for-in */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
const artistInput = document.querySelector('#recommend-artist');
const trackInput = document.querySelector('#recommend-track');
// const genreDiv = document.querySelector('.recommend-genre-div');
// const addGenre = document.querySelector('.recommend-add-genre-button');
const submit = document.querySelector('.audio-features-submit');
let uris = [];

// Search Result divs
const artistSearchResult = document.querySelector('.artists-search-result');
const tracksSearchResult = document.querySelector('.tracks-search-result');

const seedsSelected = {};
seedsSelected.track = document.querySelector('.selected-seeds__tracks');
seedsSelected.artist = document.querySelector('.selected-seeds__artists');
seedsSelected.genre = document.querySelector('.selected-seeds__genres');

// artist and track search variables
const seeds = {};
seeds.track = [];
seeds.artist = [];
seeds.genre = [];

// Max number of seeds to accept - 5 as per Spotify api
const maxNum = 2;

let resultSearch = [];
let inputTimeOut;

// genre search variables
let genres = [];
// Only takes track or artist - since that spotify call is different for genres.
const inputListener = (inputElement, type, outPutDiv) => {
  inputElement.addEventListener('keyup', e => {
    // eslint-disable-next-line no-use-before-define
    manageInput(e, inputElement, type, outPutDiv);
  });
};

const touchListener = (inputElement, type, outPutDiv) => {
  inputElement.addEventListener('input', e => {
    // eslint-disable-next-line no-use-before-define
    manageInput(e, inputElement, type, outPutDiv);
  });
};

inputListener(artistInput, 'artist', artistSearchResult);
inputListener(trackInput, 'track', tracksSearchResult);
touchListener(artistInput, 'artist', artistSearchResult);
touchListener(trackInput, 'track', tracksSearchResult);

const manageInput = (e, input, type, div) => {
  clearTimeout(inputTimeOut);
  // eslint-disable-next-line no-use-before-define
  inputTimeOut = setTimeout(fetchItem, 800, input.value, type, div);
};

async function fetchItem(q, type, outputDiv) {
  if (q === '') {
    const divToClear = outputDiv.querySelector('.recommend-input-list-suggestions');
    if (divToClear) {
      divToClear.remove();
    }
    return;
  }

  const res = await fetch(`/search?q=${q}&type=${type}`);
  if (res.status === 200) {
    const json = await res.json();
    // eslint-disable-next-line no-param-reassign
    outputDiv.innerHTML = '';
    const div = document.createElement('div');
    div.setAttribute('class', 'recommend-input-list-suggestions');
    json.forEach(result => {
      const innerDiv = document.createElement('div');
      innerDiv.setAttribute('class', 'recommend-input-list-div');
      const artistP = document.createElement('p');
      artistP.setAttribute('class', 'recommend-input-list-item recommend-input-list-item__name');
      artistP.innerText = result.name;
      innerDiv.appendChild(artistP);

      if (type === 'track') {
        const trackP = document.createElement('p');
        trackP.setAttribute('class', 'recommend-input-list-item recommend-input-list-item__artist');
        trackP.innerText = ` (${result.artists.toString()})`;
        innerDiv.appendChild(trackP);
      }

      div.appendChild(innerDiv);
    });

    resultSearch = json.slice();

    outputDiv.appendChild(div);
    // eslint-disable-next-line no-use-before-define
    artistEventListeners(type, outputDiv);
  } else {
    // Do not refresh here as some artists would not be found. Rather display no match found or something.
  }
}

function artistEventListeners(type, outputDiv) {
  // const artistsDiv = recommendArtistList.querySelector('.recommend-input-list-suggestions');
  const results = outputDiv.childNodes;

  // eslint-disable-next-line prefer-const
  for (let res of results) {
    res.addEventListener('click', () => {
      if (seeds[type].length > maxNum) {
        artistInput.value = '';
        trackInput.value = '';
        outputDiv.innerHTML = `
                    <p class="max-seeds-reached" > A maximum of ${maxNum} ${type}s reached </p>
                `;
        const maxMsg = outputDiv.querySelector('.max-seeds-reached');
        maxMsg.addEventListener('click', () => {
          outputDiv.innerHTML = '';
        });
      }

      const itemName = res.querySelector('.recommend-input-list-item__name');
      const result = findItem(resultSearch, itemName.innerText);
      seeds[type].push(result);

      artistInput.value = '';
      trackInput.value = '';
      outputDiv.innerHTML = '';

      displaySeeds();
    });
  }
}

function findItem(arr, target) {
  // eslint-disable-next-line prefer-const
  for (let item of arr) {
    if (item.name === target) {
      return item;
    }
  }
  return 'not found';
}

function displaySeeds() {
  // eslint-disable-next-line prefer-const
  for (let type in seeds) {
    seedsSelected[type].innerHTML = '';
    if (seeds[type].length > 0) {
      const heading = document.createElement('h3');
      heading.setAttribute('class', 'type-selected');
      heading.innerText = `Selected ${type}s`;
      seedsSelected[type].appendChild(heading);

      if (type === 'genre') {
        // eslint-disable-next-line prefer-const
        for (let genre of seeds.genre) {
          const div = document.createElement('div');
          div.setAttribute('class', 'selected-item-div');
          const genrePar = document.createElement('p');
          genrePar.setAttribute('class', 'select-item-text');
          genrePar.innerText = genre;

          const removeDiv = document.createElement('div');
          removeDiv.setAttribute('class', 'select-item-remove-div');
          const removePar = document.createElement('p');
          removePar.setAttribute('class', 'selected-item-remove');
          removePar.setAttribute('type', type);
          removePar.setAttribute('name', genre);
          removePar.innerText = '+';
          removeDiv.appendChild(removePar);

          div.appendChild(genrePar);
          div.appendChild(removeDiv);
          seedsSelected.genre.appendChild(div);
        }
      } else {
        for (const item in seeds[type]) {
          const { name } = seeds[type][item];
          const constainerDiv = document.createElement('div');
          constainerDiv.setAttribute('class', 'selected-item-div');
          const nameDiv = document.createElement('div');
          nameDiv.setAttribute('class', 'select-item-text');

          constainerDiv.appendChild(nameDiv);
          constainerDiv.appendChild(nameDiv);

          namePar = document.createElement('p');
          namePar.innerText = name;
          nameDiv.appendChild(namePar);

          if (type === 'track') {
            artistPar = document.createElement('p');
            artistPar.innerText = ` - (${seeds[type][item].artists.toString()})`;
            nameDiv.appendChild(artistPar);
          }

          const removeDiv = document.createElement('div');
          removeDiv.setAttribute('class', 'select-item-remove-div');
          const removePar = document.createElement('p');
          removePar.setAttribute('class', 'selected-item-remove');
          removePar.setAttribute('type', type);
          removePar.setAttribute('name', name);
          removePar.innerText = '+';
          removeDiv.appendChild(removePar);

          constainerDiv.appendChild(removeDiv);
          seedsSelected[type].appendChild(constainerDiv);
        }
      }
    }
  }

  removeListeners();
}

const removeListeners = () => {
  const seedItemDivs = document.querySelectorAll('.selected-item-div');
  seedItemDivs.forEach(item => {
    const seedToRemove = item.querySelector('.selected-item-remove');
    seedToRemove.addEventListener('click', () => {
      seedType = seedToRemove.getAttribute('type');
      seedName = seedToRemove.getAttribute('name');
      deleteSeed(seedType, seedName);
      displaySeeds();
    });
  });
};

const deleteSeed = (type, seedName) => {
  if (type === 'genre') {
    seeds[type] = seeds[type].filter(el => el !== seedName);
  } else {
    seeds[type] = seeds[type].filter(el => el.name !== seedName);
  }
};

const returnGenres = async () => {
  if (genres.length === 0) {
    const genresBody = await fetch('/genres');
    if (genresBody.status === 200) {
      const genresJson = await genresBody.json();
      genres = genresJson;

      genres.unshift('select genre');
      const genreInput = document.querySelector('#recommended-genre');

      for (const genre of genres) {
        const option = document.createElement('option');
        option.setAttribute('value', genre);
        option.innerText = genre;
        genreInput.appendChild(option);
      }

      genreInput.addEventListener('change', () => {
        if (seeds.genre.length >= maxNum) {
          flashMessage('Maximum number of genres selected');
        }
        // eslint-disable-next-line no-console
        if (genreInput.value === 'select genre') {
          return;
        }
        seeds.genre.push(genreInput.value);
        displaySeeds();
      });
    } else {
      promptTokenRefresh();
    }
  }
};

returnGenres();

const genreInput = document.querySelector('#recommended-genre');

genreInput.addEventListener('click', returnGenres);

// Returns the search results
submit.addEventListener('click', async e => {
  e.preventDefault();
  const seedsFormField = document.querySelector('#seedsInput');
  const seedsValue = JSON.stringify(seeds);
  seedsFormField.setAttribute('value', seedsValue);

  const numTracksInput = document.querySelector('.recommendation-num-results-input');
  const numTracks = document.querySelector('#numTracks');
  numTracks.setAttribute('value', parseInt(numTracksInput.value));

  const emptyFields = [];

  for (const type in seeds) {
    if (seeds[type].length === 0) {
      emptyFields.push(`${type}`);
    }
  }

  if (emptyFields.length > 0) {
    flashMessage(`Please supply at least one: ${emptyFields.join(', ')}.
    You can select up to 5 artists, tracks and genres per search.`,
    8000);
    return;
  }
  const recommendationForm = document.querySelector('#recommendation-form');
  const formData = new FormData(recommendationForm);

  const res = await fetch('/recommend', {
    method: 'post',
    body: formData,
  });

  if (res.status === 200) {
    const json = await res.json();
    displayResults(json);

    // eslint-disable-next-line no-unused-vars
    uris = json.uris;
    window.scrollTo(0, 0);
  } else {
    if (res.status === 404) {
      promptTokenRefresh();
      return;
    }
    noResultsDisplay();
    flashMessage('No results found');
  }
});

const resultsContentDiv = document.querySelector('.results-content');
const hideResultsContent = document.querySelector('.results-hide');
const hideResultsImage = document.querySelector('.results-hide-btn');

let hide = false;
upArrow = '../imgs/up-arrow.svg';
downArrow = '../imgs/down-arrow.svg';

hideResultsContent.addEventListener('click', () => {
  resultsContentDiv.classList.toggle('invisible');

  if (hide) {
    hideResultsImage.setAttribute('src', upArrow);
    hide = false;
  } else {
    hide = true;
    hideResultsImage.setAttribute('src', downArrow);
  }
});

const toggleMute = (mute, feature) => {
  const slider = feature.querySelector('.audio-feature-slider');

  // Change the selected icon and either add or remove disable from the input field
  if (feature.getAttribute('class').split(' ').includes('feature-off')) {
    mute.setAttribute('src', '../imgs/tick.svg');
    slider.removeAttribute('disabled');
  } else {
    mute.setAttribute('src', '../imgs/drop-down.svg');
    slider.setAttribute('disabled', true);
  }

  // Change the entire content to grayed out
  feature.classList.toggle('feature-off');
  slider.classList.toggle('feature-off');
};

// Add or remove the sliders from the recommender
const featureSections = document.querySelectorAll('.audio-feature-section');
for (const feature of featureSections) {
  const mute = feature.querySelector('.feature-tick');
  mute.addEventListener('click', () => {
    toggleMute(mute, feature);
  });
}

// Advanced featues
const advancedFaturesButton = document.querySelector('.audio-features-advanced');

advancedFaturesButton.addEventListener('click', () => {
  const advancedFeatures = document.querySelectorAll('.advanced-feature');

  for (const feature of advancedFeatures) {
    // Hides the feature
    feature.classList.toggle('invisible');

    // "Turn off (resets to grayed out and disable) the advanced features when pressed. Either way you get a clean slate"
    featureSection = feature.querySelector('.audio-feature-section');
    const featureOff = feature.getAttribute('class').split(' ').includes('invisible');
    if (!featureOff) {
      featureMute = feature.querySelector('.feature-tick');
      featureSection.classList.remove('feature-off');
      const slider = feature.querySelector('.audio-feature-slider');
      slider.classList.remove('feature-off');
      toggleMute(featureMute, featureSection);
    }
  }

  const headings = document.querySelectorAll('.feature-section-title');
  for (const heading of headings) {
    heading.classList.toggle('invisible');
  }

  changeAdvancedFeaturesButtonName();
});

let advancedFeaturesOpen = false;

const changeAdvancedFeaturesButtonName = () => {
  advancedFeaturesOpen = !advancedFeaturesOpen;
  if (advancedFeaturesOpen) {
    advancedFaturesButton.innerText = 'Basic Features';
  } else {
    advancedFaturesButton.innerText = 'Advanced Features';
  }
};

const increaseTracks = document.querySelector('.increase-num-tracks');
const decreaseTracks = document.querySelector('.decrease-num-tracks');
const numTracks = document.querySelector('.recommendation-num-results-input');

increaseTracks.addEventListener('click', () => {
  const nums = parseInt(numTracks.value);
  if (nums >= 100) {
    // eslint-disable-next-line no-useless-return
    return;
  } else {
    numTracks.value = nums + 1;
  }
});

decreaseTracks.addEventListener('click', () => {
  const nums = parseInt(numTracks.value);
  if (nums <= 1) {
    return;
  } else {
    numTracks.value = nums - 1;
  }
});

numTracks.addEventListener('keydown', e => {
  e.preventDefault();
});

let timeout;
let intervizzle;

increaseTracks.addEventListener('mousedown', increaseTracksInterval);
increaseTracks.addEventListener('touchstart', increaseTracksInterval);
decreaseTracks.addEventListener('mousedown', decreaseTracksInterval);
decreaseTracks.addEventListener('touchstart', decreaseTracksInterval);

function increaseTracksInterval() {
  timeout = setTimeout(() => {
    intervizzle = setInterval(() => {
      if (parseInt(numTracks.value) < 100) {
        numTracks.value = parseInt(numTracks.value) + 1;
      }
    }, 60);
  }, 500);
}

function decreaseTracksInterval() {
  timeout = setTimeout(() => {
    intervizzle = setInterval(() => {
      if (parseInt(numTracks.value) > 0) {
        numTracks.value = parseInt(numTracks.value) - 1;
      }
    }, 100);
  }, 500);
}

increaseTracks.addEventListener('mouseup', clearTimers);
increaseTracks.addEventListener('mouseleave', clearTimers);
increaseTracks.addEventListener('touchend', clearTimers);
increaseTracks.addEventListener('touchmove', clearTimers);
decreaseTracks.addEventListener('mouseup', clearTimers);
decreaseTracks.addEventListener('mouseleave', clearTimers);
decreaseTracks.addEventListener('touchend', clearTimers);
decreaseTracks.addEventListener('touchmove', clearTimers);

function clearTimers() {
  clearTimeout(timeout);
  clearInterval(intervizzle);
}
