const topArtistsButton = document.querySelector('.top-listens-button__artists');
const topTracksButton = document.querySelector('.top-listens-button__tracks');
const topListensTracks = document.querySelector('.top-listens__tracks');
const topArtistsTracks = document.querySelector('.top-listens__artists')


topArtistsButton.addEventListener('click', e => {
    topArtistsTracks.classList.toggle('invisible');
});

topTracksButton.addEventListener('click', e => {
    topListensTracks.classList.toggle('invisible');
});

