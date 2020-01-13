const functions = require("firebase-functions");
const app = require("express")();

const { getAllScreams, createScream } = require("./handlers/screams");
const { singup, login, uploadImage } = require("./handlers/users");
const FBAuth = require("./handlers/fbAuth");

//ROUTES

app.get("/screams", getAllScreams);
app.post("/screams", FBAuth, createScream);

app.post("/singup", singup);
app.post("/login", login);
app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);
