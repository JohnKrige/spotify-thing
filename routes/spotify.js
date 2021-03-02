/* eslint-disable camelcase */
// https://github.com/thelinmichael/spotify-web-api-node
// There is a nice api for node, link above.

const querystring = require('querystring');
const randomstring = require('randomstring');
const request = require('request');
const express = require('express');
const fetch = require('node-fetch');
const Bluebird = require('bluebird');
const multer = require('multer');

const upload = multer();

fetch.Promise = Bluebird;

const { activeSession, topListens } = require('../middleware');
const { getArtistData, audioFeatureScales, produceSeedArray, getDesiredInfo } = require('./spotifyHelpers');

const router = express.Router();

const client_id = '774f74e3029946fe9f5c9ee7a1ee5f3d'; // Your client id
const clientSecret = '352f29ce4cd6414cada4e6afd267675b'; // Your secret
const redirect_uri = 'http://localhost:3000/callback';
// const redirect_uri = 'http://playlistshaman.com/callback';

router.get('/', topListens(5, 'short'), (req, res) => {
  // Check if the spotify token has to be refreshed. Middleware this?
  const currentTime = Date.now();
  const { lastRefresh } = req.session;
  const hourInMs = 1000 * 60 * 60; // tokens remain valid for 1h.
  if ((currentTime - lastRefresh) > hourInMs && req.session.lastRefresh) {
    res.redirect('/refresh_token');
  } else {
    res.render('home.ejs', { data: {
      user: req.session.userDetails,
      topTracks: req.session.tracks,
      topArtists: req.session.artists,
    },
    });
  }
});

const stateKey = 'spotify_auth_state';

router.get('/login', (req, res) => {
  const state = randomstring.generate(16);
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private';
  res.redirect(`https://accounts.spotify.com/authorize?${
    querystring.stringify({
      response_type: 'code',
      client_id,
      scope,
      redirect_uri,
      state, // This is included for security purposes. The docs recommend this.
    })
  }`);
});

router.get('/callback', (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  // This checks the state returned by the spotify webapi to the stored state we created.
  // If it matched, great, else redirect to home.
  if (state === null || state !== storedState) {
    res.redirect(`/
    ${querystring.stringify(
    { error: 'state_mismatch' },
  )}`);
  } else { // Prepares the post request to exchange the auth code for an access token.
    res.clearCookie(stateKey);
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code,
        redirect_uri,
        grant_type: 'authorization_code',
      },
      headers: {
        Authorization: `Basic ${(new Buffer.from(`${client_id}:${clientSecret}`).toString('base64'))}`,
      },
      json: true,
    };

    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const { access_token } = body;
        req.session.userAuth = body;

        const options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { Authorization: `Bearer ${access_token}` },
          json: true,
        };

        // use the access token to access the Spotify Web API
        // eslint-disable-next-line no-shadow
        request.get(options, (error, response, body) => {
          req.session.userDetails = body;
          req.session.lastRefresh = Date.now();
          res.redirect('/');
        });
      } else {
        res.redirect(`/logout'${
          querystring.stringify({
            error: 'invalid_token',
          })
        }`);
      }
    });
  }
});

router.get('/refresh_token', activeSession, (req, res) => {
  const refreshToken = req.session.userAuth.refresh_token;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { Authorization: `Basic ${(new Buffer.from(`${client_id}:${clientSecret}`).toString('base64'))}` },
    form: {
      grant_type: 'refresh_token',
      refreshToken,
    },
    json: true,
  };

  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body;
      req.session.userAuth.access_token = access_token;
      req.session.lastRefresh = Date.now();
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// URL used to return artists or tracks in json format
router.get('/search', async (req, res) => {
  const { q } = req.query;
  const { type } = req.query;
  const typePlural = `${type}s`;
  const headers = { Authorization: `Bearer ${req.session.userAuth.access_token}` };

  const searchUrl = 'https://api.spotify.com/v1/search?';
  const queryString = querystring.stringify({
    q,
    type,
    limit: '5',
  });

  const artists = await fetch(searchUrl + queryString, { headers });

  if (artists.status !== 200) {
    res.status(400).send('fail');
  } else {
    const json = await artists.json();
    const result = getArtistData(json[typePlural].items, type);
    res.status(200).json(result);
  }
});

// URL used to return genres in json format
router.get('/genres', async (req, res) => {
  const searchUrl = 'https://api.spotify.com/v1/recommendations/available-genre-seeds';
  const headers = { Authorization: `Bearer ${req.session.userAuth.access_token}` };
  const genres = await fetch(searchUrl, { headers });
  if (genres.status === 200) {
    const response = await genres.json();
    res.status(200).send(response.genres);
  } else {
    res.status(genres.status).send();
  }
});

// upload.none because multer is used to parse the multipart/form data from the FormData on the front end;
router.post('/recommend', upload.none(), async (req, res) => {
  const seeds = JSON.parse(req.body.seeds);
  const { artist, track, genre } = produceSeedArray(seeds);
  const limit = req.body.numTracks;

  const searchUrl = 'https://api.spotify.com/v1/recommendations?';
  const headers = { Authorization: `Bearer  ${req.session.userAuth.access_token}` };
  const queryObj = {};
  queryObj.seed_artists = artist.join();
  queryObj.seed_tracks = track.join();
  queryObj.seed_genres = genre.join();
  queryObj.limit = limit;

  const keys = Object.keys(req.body).filter(key => key !== 'seeds');
  // eslint-disable-next-line prefer-const
  for (let key of keys) {
    const scale = audioFeatureScales[key];
    queryObj[key] = req.body[key][scale];
  }

  const queryString = querystring.stringify(queryObj);

  const result = await fetch(searchUrl + queryString, { headers });
  if (result.status === 200) {
    const json = await result.json();
    const tracks = getDesiredInfo(json.tracks);
    res.status(200).json(tracks);
  } else {
    res.status(result.status).send();
  }
});

router.get('/playlists', async (req, res) => {
  const playlistUrl = 'https://api.spotify.com/v1/me/playlists';
  const headers = { Authorization: `Bearer ${req.session.userAuth.access_token}` };

  const resp = await fetch(playlistUrl, { headers });
  if (resp.status === 200) {
    const json = await resp.json();
    const returnObj = {};
    // eslint-disable-next-line prefer-const
    for (let item of json.items) {
      const pl = {};
      pl.name = item.name;
      pl.id = item.id;
      returnObj[item.id] = pl;
    }

    res.status(200).json(returnObj);
  } else {
    res.status(resp.status).send();
  }
});

router.post('/addToExistingPl', async (req, res) => {
  const playlistId = req.body.id;
  const uris = req.body.uris.toString();

  const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?`;
  const headers = {
    Authorization: `Bearer ${req.session.userAuth.access_token}`,
    'Content-Type': 'application/json',
  };

  const queryString = querystring.stringify({
    uris,
  });

  const response = await fetch(`${url}${queryString}`, {
    headers,
    method: 'POST' },
  // eslint-disable-next-line function-paren-newline
  );

  if (response.status === 201) {
    res.status(200).json('success');
  } else {
    res.status(response.status).send();
  }
});

router.post('/createPlaylist', async (req, res) => {
  const userId = req.session.userDetails.id;
  const url = `https://api.spotify.com/v1/users/${userId}/playlists`;
  const headers = {
    Authorization: `Bearer ${req.session.userAuth.access_token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const nameObj = {};
  nameObj.name = req.body.name;

  const response = await fetch(url, {
    headers,
    method: 'POST',
    body: JSON.stringify(nameObj),
  });

  if (response.status === 201) {
    res.status(200).send('success');
  } else {
    res.status(response.status).send();
  }
});

module.exports = router;
