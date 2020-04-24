const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth'); 

const { getAllAsks,  postOneAsk, getAsk, commentonAsk } = require('./handlers/asks');
const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser} = require('./handlers/users');

// Asks routes
app.get('/ask', getAllAsks);
app.post('/ask', FBAuth, postOneAsk);
app.get('/ask/:askId', getAsk);
app.post('/ask/:askId/comment',FBAuth, commentOnAsk);


//Users routes
app.post('/signup',signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);


exports.api = functions.region('europe-west3').https.onRequest(app);