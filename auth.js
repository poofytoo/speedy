var firebaseRef = require('./firebase');

module.exports = {
  facebookLogin: function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    var userData = {
      id: profile.id,
      name: profile.displayName
    };

    firebaseRef.ref('users/' + profile.id).once("value", function(snapshot) {
      console.log("here");
      var user = snapshot.val();
      console.log("user", user);
      if (user == null) {
        firebaseRef.ref('users').child(profile.id).set(userData, function(error) {
          console.log("hm");
          if (error) {
            console.error("Error creating user:", error);
          } else {
            return done(false, userData);
          }
        });
      } else {
        return done(null, user);
      }
    }, function(error) {
      console.log(error, "sad");
    });
  },
  serializeUser: function(user, done) {
    console.log(user);
    return done(null, user.id);
  },

  deserializeUser: function(id, done) {
    firebaseRef.ref('users/' + id).once("value", function(userData) {
      if (userData.val() != null) {
        return done(null, userData.val());
      }
    });
  },
  loggedIn: function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.session.returnPath = req.route.path;
        res.redirect('/login');
    }
  },
}
