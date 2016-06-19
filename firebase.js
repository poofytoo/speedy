var firebase = require("firebase");

// Initialize the app with a service account, granting admin privileges
firebase.initializeApp({
  databaseURL: "https://speedy-4169e.firebaseio.com/",
  serviceAccount: "speedy.service.private.key.json"
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
module.exports = firebase.database();
