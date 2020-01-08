const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();
const serviceAccount = require("./key/serviceAccountKey.json");
const firebase = require("firebase");

const firebaseConfig = {
  apiKey: "AIzaSyApUedlKnwCIFaM1cXzGQ8zD7-Mw_iORr8",
  authDomain: "treinofb.firebaseapp.com",
  databaseURL: "https://treinofb.firebaseio.com",
  projectId: "treinofb",
  storageBucket: "treinofb.appspot.com",
  messagingSenderId: "220960249581",
  appId: "1:220960249581:web:872bfcd5d190c18df59ee4",
  measurementId: "G-M1YLTBLNWB"
};

firebase.initializeApp(firebaseConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://treinofb.firebaseio.com"
});

const db = admin.firestore();

const isEmpty = string => {
  if (string.trim() === "") return true;
  else return false;
};

const isEmailInvalid = email => {
  if (email.indexOf("@") == -1) {
    return true;
  } else if (email.indexOf(".com") == -1) {
    return true;
  } else {
    return false;
  }
};

const isPassInvalid = pass => {
  if (pass.length < 8) {
    return true;
  } else {
    return false;
  }
};

const FBAuth = (req, res, next) => {
  let idToken;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found!");
    res.status(403).json({ error: "Unauthorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
    });
};

//ROUTES

app.get("/screams", (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          ...doc.data()
        });
      });
      return res.json(screams);
    })
    .catch(err => console.error(err));
});

app.post("/screams", FBAuth, (req, res) => {
  let newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection("screams")
    .add(newScream)
    .then(doc => {
      res.json({ message: `Scream ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "Something go wrong! =(" });
      console.error(err);
    });
});

app.post("/singup", (req, res) => {
  let token, userId;

  let newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  if (isEmpty(newUser.email)) {
    return res.status(400).json({ email: "Email shouldn't be empty!" });
  } else if (isEmailInvalid(newUser.email)) {
    return res.status(400).json({ email: "Email is invalid!" });
  }

  if (isEmpty(newUser.handle)) {
    return res.status(400).json({ handle: "Handle is empty!" });
  }

  if (isEmpty(newUser.password)) {
    return res.status(400).json({ password: "Password is empty!" });
  } else if (isPassInvalid(newUser.password)) {
    return res.status(400).json({ password: "Password is invalid!" });
  } else if (newUser.password != newUser.confirmPassword) {
    return res.status(400).json({ password: "Passwords should match!" });
  }

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "This handle is alredy taken!" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      let userCredentials = {
        email: newUser.email,
        handle: newUser.handle,
        createdAt: new Date().toISOString(),
        userId
      };

      return db.doc(`/users/${userCredentials.handle}`).set(userCredentials);
    })
    .then(data => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email already in use!" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

app.post("/login", (req, res) => {
  let user = {
    email: req.body.email,
    password: req.body.password
  };

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      console.log(token);
      return res.json({ token });
    })
    .catch(err => {
      if (err.code === "auth/wrong-password" || "auth/user-not-found") {
        return res
          .status(403)
          .json({ login: "Wrong credentials, please try again!" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

exports.api = functions.https.onRequest(app);
