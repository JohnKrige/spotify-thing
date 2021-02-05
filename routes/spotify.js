// https://github.com/thelinmichael/spotify-web-api-node
// There is a nice api for node, link above. 

const querystring = require('querystring');
const randomstring = require('randomstring');
const request = require('request');
const express = require('express');
const fetch = require('node-fetch');
const Bluebird = require('bluebird');
const multer =  require('multer');
const upload = multer();
 
fetch.Promise = Bluebird;

const { activeSession, topListens } = require('../middleware');
const { getArtistData, audioFeatureScales, produceSeedArray, getDesiredInfo } = require('./spotifyHelpers');

const router = express.Router();

const client_id = '774f74e3029946fe9f5c9ee7a1ee5f3d'; // Your client id
const client_secret = '352f29ce4cd6414cada4e6afd267675b'; // Your secret
const redirect_uri = 'http://localhost:3000/callback'; // Your redirect uri

router.get('/', topListens(5, 'short'), (req, res) => {
  // Check if the spotify token has to be refreshed. Middleware this? 
  let currentTime = Date.now();
  let last_refresh = req.session.lastRefresh
  hourInMs = 1000 * 60 * 60 // tokens remain valid for 1h. 
  if((currentTime - last_refresh) > hourInMs && req.session.lastRefresh){
    res.redirect('/refresh_token');
  } else {
    res.render('home.ejs', { data: { 
      user: req.session.userDetails, 
      topTracks: req.session.tracks,
      topArtists: req.session.artists,
  }});
  }
});

const stateKey = 'spotify_auth_state';

router.get('/login', function(req, res) {
  let state = randomstring.generate(16);
  res.cookie(stateKey, state);
  // your application requests authorization
  // Scopes - user top read: Most played artists and tracks
  const scope = 'user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private'; 
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope, // need to up the scope for this project. Get to it son
      redirect_uri: redirect_uri,
      state: state // This is included for security purposes. The docs recommend this. 
    })
  );
});

router.get('/callback', (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;

    // This checks the state returned by the spotify webapi to the stored state we created. If it matched, great, else redirect to home.
    if (state === null || state !== storedState) {
        res.redirect('/login' +
          querystring.stringify({
            error: 'state_mismatch'
          }));
      }
      // Prepares the post request to exchange the auth code for an access token.
      else {
        res.clearCookie(stateKey);
        const authOptions = {
          url: 'https://accounts.spotify.com/api/token',
          form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
          },
          headers: {
            'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
          },
          json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

              const access_token = body.access_token,
              refresh_token = body.refresh_token;

              req.session.userAuth = body;
      
              const options = {
                url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
              };
      
              // use the access token to access the Spotify Web API
              request.get(options, function(error, response, body) {
                  req.session.userDetails = body;
                  req.session.lastRefresh = Date.now();
                  res.redirect('/');
              });

            } else {
                res.redirect('/logout' +
                  querystring.stringify({
                    error: 'invalid_token'
                  }
                ));
            }
        });
    }
});

router.get('/refresh_token',activeSession ,function(req, res) {
  const refresh_token = req.session.userAuth.refresh_token;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      req.session.userAuth.access_token = access_token;
      req.session.lastRefresh = Date.now();
      res.redirect('/');
    } else{
      res.redirect('/login');
    }
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// URL used to return artists or tracks in json format
router.get('/search', async (req,res) => {
  const q = req.query.q;
  const type = req.query.type;
  typePlural = type + 's';
  const headers = { 'Authorization': 'Bearer ' + req.session.userAuth.access_token }

  const searchUrl = 'https://api.spotify.com/v1/search?';
  const queryString = querystring.stringify({
    q: q,
    type: type,
    limit: '5',
  });

  const artists = await fetch(
    searchUrl + queryString,
    { headers: headers }
  );

  if(artists.status !== 200){
    console.log('result not found, try refreshing the user token')
  } else {
    json = await artists.json();
    let result = getArtistData(json[typePlural].items, type);
    res.json(result);
  }
});

// URL used to return genres in json format
router.get('/genres', async (req, res) => {
  const searchUrl = 'https://api.spotify.com/v1/recommendations/available-genre-seeds';
  const headers = { 'Authorization': 'Bearer ' + req.session.userAuth.access_token }
  const genres = await fetch(searchUrl, { headers });
  if(genres.status === 200){
    response = await genres.json();
    res.send(response.genres);
  } else {
    res.send('fail');
  }
});

// This is the scale by which to reduce the values comming in from the form on the frontend

// upload.none because multer is used to parse the multipart/form data from the FormData on the front end;
router.post('/recommend', upload.none() , async (req, res) => {
  let seeds = JSON.parse(req.body.seeds);
  const { artist, track, genre } = produceSeedArray(seeds);

  const searchUrl = 'https://api.spotify.com/v1/recommendations?';
  const headers = { 'Authorization': 'Bearer ' + req.session.userAuth.access_token };
  let queryObj = {}
  queryObj.seed_artists = artist.join();
  queryObj.seed_tracks = track.join();
  queryObj.seed_genres = genre.join();
  queryObj.limit = 5;

  let keys = Object.keys(req.body).filter( key => key !== "seeds");
  for(let key of keys){
    let scale = audioFeatureScales[key]
    queryObj[key] = req.body[key]/scale;
  }

  const queryString = querystring.stringify(queryObj);

  const result = await fetch(searchUrl + queryString, { headers } );
  if(result.status === 200){
    const json = await result.json();
    const tracks = getDesiredInfo(json.tracks);
    res.json(tracks);

  } else {
    console.log('Error fetching');
  }
});

router.get('/playlists', async (req,res) => {
  const playlistUrl = 'https://api.spotify.com/v1/me/playlists'
  const headers = { 'Authorization': 'Bearer ' + req.session.userAuth.access_token };

  const resp = await fetch(playlistUrl, { headers });
  if(resp.status === 200){
    const json = await resp.json();
    returnObj = {}
    for(let item of json.items){
      pl = {}
      pl.name = item.name;
      pl.id = item.id;
      returnObj[item.id] = pl;
    }

    res.json(returnObj);

  } else {
      console.log('Error-playlists not fetched');
  }
});

router.post('/addToExistingPl', async (req,res) => {
  const playlistId = req.body.id;
  const uris = req.body.uris.toString();

  url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?`;
  const headers = { 
    'Authorization': 'Bearer ' + req.session.userAuth.access_token,
    'Content-Type': 'application/json',
  };

  const queryString = querystring.stringify({
    uris: uris
  })

  const response = await fetch(url+queryString, { 
    headers: headers,
    method: 'POST' }
  );

  if(response.status === 201){
    console.log('success Mofo!')
    res.json('success');
  } else {
    console.log('Epic fail there china');
    res.json('fail');
  }
});

router.post('/createPlaylist', async(req, res) => {
  let user_id = req.session.userDetails.id;
  url = `https://api.spotify.com/v1/users/${user_id}/playlists`;
  const headers = { 
    'Authorization': 'Bearer ' + req.session.userAuth.access_token,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  let nameObj = {}
  nameObj.name = req.body.name;

  const response = await fetch(url, { 
    headers: headers,
    method: 'POST', 
    body: JSON.stringify(nameObj),
  });

  if(response.status === 201){
    let json = response.json();
    res.json('success');
  } else {
    res.json('failure');
    console.log('Playlist creation failed');
  }
});

  




module.exports = router;
