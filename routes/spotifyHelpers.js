const helper = {};

helper.getTrackData = tracksArr => {
  const topTracks = [];
  tracksArr.forEach(item => {
    const track = {};
    track.artists = [];
    track.name = item.name;
    track.album = item.album.name;
    item.artists.forEach(artist => {
      track.artists.push(artist.name);
    });

    topTracks.push(track);
  });

  return topTracks;
};

helper.getArtistData = (arr, type = 'default') => {
  const topResults = [];
  arr.forEach(item => {
    const result = {};
    result.name = item.name;
    result.images = item.images;
    result.id = item.id;
    if (type === 'track') {
      result.artists = [];
      item.artists.forEach(ar => {
        result.artists.push(ar.name);
      });
    }
    topResults.push(result);
  });
  return topResults;
};

helper.audioFeatureScales = {
  target_acousticness: 100,
  min_acousticness: 100,
  max_acousticness: 100,
  target_danceability: 100,
  min_danceability: 100,
  max_danceability: 100,
  target_energy: 100,
  min_energy: 100,
  max_energy: 100,
  target_instrumentalness: 100,
  min_instrumentalness: 100,
  max_instrumentalness: 100,
  target_liveliness: 100,
  max_liveliness: 100,
  min_liveliness: 100,
  target_loudness: 100,
  min_loudness: 100,
  max_loudness: 100,
  target_popularity: 100,
  min_popularity: 100,
  max_popularity: 100,
  target_mode: 1,
  target_speechiness: 100,
  min_speechiness: 100,
  max_speechiness: 100,
  target_tempo: 1,
  min_tempo: 1,
  max_tempo: 1,
  target_valence: 100,
  min_valence: 100,
  max_valence: 100,
};

helper.produceSeedArray = obj => {
  const seedsObj = {};
  seedsObj.artist = [];
  seedsObj.track = [];
  seedsObj.genre = [];
  // eslint-disable-next-line prefer-const
  for (let type in obj) {
    if (type === 'genre') {
      seedsObj.genre = obj.genre;
    } else {
      // eslint-disable-next-line prefer-const
      for (let item of obj[type]) {
        seedsObj[type].push(item.id);
      }
    }
  }
  return seedsObj;
};

helper.getDesiredInfo = tracks => {
  const result = {};
  result.tracksProcessed = [];
  result.uris = [];
  tracks.forEach(track => {
    const trackObj = {};
    trackObj.name = track.name;
    trackObj.external_urls = track.external_urls;
    trackObj.href = track.href;
    trackObj.id = track.id;
    trackObj.preview_url = track.preview_url;
    trackObj.uri = track.uri;
    trackObj.artists = [];

    track.artists.forEach(artist => {
      trackObj.artists.push(artist.name);
    });

    result.tracksProcessed.push(trackObj);
    result.uris.push(track.uri);
  });

  return result;
};

module.exports = helper;
