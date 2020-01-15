const { admin, db } = require("../utils/admin");

const firebase = require("firebase");

const { config } = require("../key/firebaseConfig");

const {
  isEmpty,
  isEmailInvalid,
  isPassInvalid,
  reduceUserDetails
} = require("../handlers/validators");

firebase.initializeApp(config);

exports.singup = (req, res) => {
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

  const noImg = 'no-image.png'

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
        imageUrl: `https://firebase.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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
};

exports.login = (req, res) => {
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
};

exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(() => {
      return res.json({ message: 'Details add successfully' })
    })
    .catch(err => {
      return res.status(500).json({ error: err.code });
    })
}

exports.getAuthUser = (req, res) => {
  let userData = {};

  db.doc(`/users/${req.user.handle}`).get()
    .then(doc => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db.collection('likes').where('userHandle', '==', req.user.handle).get()
      }
    })
    .then(data => {
      userData.likes = [];
      data.forEach(doc => {
        userData.likes.push(doc.data());
      })
      return res.json(userData)
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({ error: err.code })
    })
}

exports.uploadImage = async (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file type submitted' });
    }

    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split('.')[filename.split('.').length - 1];

    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;

    const filepath = path.join(os.tmpdir(), imageFileName);

    imageToBeUploaded = { filepath, mimetype };

    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', async () => {
    await admin
      .storage()
      .bucket(config.storageBucket)
      .upload(imageToBeUploaded.filepath, {
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
          config.storageBucket
          }/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: 'image uploaded successfully' });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: 'something went wrong' });
      });
  });
  busboy.end(req.rawBody);
};
