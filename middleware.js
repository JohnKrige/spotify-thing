/* eslint-disable consistent-return */
const Bluebird = require('bluebird');
const fetch = require('node-fetch');
const { getTrackData, getArtistData } = require('./routes/spotifyHelpers');

fetch.Promise = Bluebird;

const middleware = {};

middleware.activeSession = (req, res, next) => {
  if (req.session.userAuth) {
    next();
  } else {
    res.redirect('/');
  }
};

// eslint-disable-next-line arrow-body-style
middleware.topListens = (limit, time) => {
  return async (req, _res, next) => {
    if (req.session.userAuth) {
      // Prevens fetching top played data on every request. Obvs stored to the session.
      // eslint-disable-next-line no-use-before-define
      if (req.session.tracks && req.session.artists && checkLastRefreshed(req.session.topPlayedLastRefreshed)) {
        return next();
      }

      req.session.topPlayedLastRefreshed = Date.now();
      const trackUrl = `https://api.spotify.com/v1/me/top/tracks?time_range=${time}_term&limit=${limit}`;
      const artistUrl = `https://api.spotify.com/v1/me/top/artists?time_range=${time}_term&limit=${limit}`;
      const headers = { Authorization: `Bearer ${req.session.userAuth.access_token}` };

      const artistResult = await fetch(artistUrl, { headers });
      if (artistResult.status === 200) {
        const artistData = await artistResult.json();
        req.session.artists = getArtistData(artistData.items);
      } else {
        req.session.artists = null;
      }

      const trackResult = await fetch(trackUrl, { headers });
      if (trackResult.status === 200) {
        const trackData = await trackResult.json();
        req.session.tracks = getTrackData(trackData.items);
      } else {
        req.session.tracks = null;
      }
      next();
    } else {
      req.session.artists = null;
      req.session.tracks = null;
      next();
    }
  };
};

// Refreshes max once every 12h - why 12? wtf not
const checkLastRefreshed = timeToCheck => {
  if (timeToCheck) {
    const timeThen = new Date(timeToCheck);
    const timeNow = new Date(Date.now());
    const lapsed = timeThen.getTime() - timeNow.getTime();
    // console.log((lapsed/(1000 * 60 * 60 * 12)));
    return (lapsed / (1000 * 60 * 60 * 12)) > -1;
  // eslint-disable-next-line no-else-return
  } else {
    return false;
  }
};

module.exports = middleware;
