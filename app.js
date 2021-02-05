const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore =  require('connect-mongo')(session);
const bodyParser = require('body-parser');

const app = express();
const spotifyRoutes = require('./routes/spotify');

// Mongoose connection settings
mongoose.connect('mongodb://localhost/spotify', {useNewUrlParser: true, useUnifiedTopology: true});

app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

const sessionStore = new MongoStore({
  mongooseConnection: mongoose.connection,
  collection: 'sessions'
});

app.use(session({
  secret: 'This is truly a secret I would take to the grave',
  resave: false,
  store: sessionStore, 
  saveUninitialized: true,
  cookie: { 
    // secure: true,
    maxAge: 1000 * 60 * 60 * 24 // 1000ms x 60 secs * 60 mins * 24h = 1 day
   }
}));

app.use(spotifyRoutes);


app.listen(3000, (req, res) => {
    console.log('We are live!')
})