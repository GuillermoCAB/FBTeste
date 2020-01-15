const functions = require("firebase-functions");
const app = require("express")();

const { getAllScreams, createScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream } = require("./handlers/screams");
const { singup, login, uploadImage, addUserDetails, getAuthUser } = require("./handlers/users");
const FBAuth = require("./handlers/fbAuth");

//SCREAM ROUTES
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, createScream);
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);

//USER ROUTES
app.post("/singup", singup);
app.post("/login", login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthUser);

exports.api = functions.https.onRequest(app);
