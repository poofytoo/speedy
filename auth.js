var firebaseRef = require('./firebase');

module.exports = {
  facebookLogin: function(accessToken, refreshToken, profile, done) {
    var name = profile.displayName.split(" ");
    var userData = {
      id: profile.id,
      name: profile.displayName,
      firstName: name[0],
      lastInitial: name[name.length - 1].substring(0, 1)
    };

    firebaseRef.ref('users/' + profile.id).once("value", function(snapshot) {
      var user = snapshot.val();
      if (user == null) {
        firebaseRef.ref('users').child(profile.id).set(userData, function(error) {
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
        res.redirect('/');
    }
  },
}
