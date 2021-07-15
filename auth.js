const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;;
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;
const GitHubStrategy = require('passport-github').Strategy;;
require('dotenv').config();
const flash = require('connect-flash');
// const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;



module.exports = function (app, myDataBase, myPosts) {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Incorrect Username' }); }
        if (!bcrypt.compareSync(password, user.password)) { 
          return done(null, false, { message: 'Incorrect Password' });
        }
        return done(null, user);
      });
    }
  ));

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://social-panda.panda4817.repl.co/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      myDataBase.findOneAndUpdate(
        { id: profile.id },
        {
          $setOnInsert: {
            id: profile.id,
            username: profile.username,
            created_on: new Date(),
            provider: profile.provider || ''
          },
          $set: {
            last_login: new Date()
          },
          $inc: {
            login_count: 1
          }
        },
        { upsert: true, returnOriginal: false },
        (err, doc) => {
          console.log(err)
          console.log(doc)
          return cb(null, doc.value);
        }
      )}
  ));

//   passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: "https://social-panda.panda4817.repl.co/auth/facebook/callback"
//   },
//   function(accessToken, refreshToken, profile, done) {
//     console.log(profile);
//     myDataBase.findOneAndUpdate(
//       { id: profile.id },
//       {
//         $setOnInsert: {
//           id: profile.id,
//           username: profile.username || profile.displayName,
//           created_on: new Date(),
//           provider: profile.provider || ''
//         },
//         $set: {
//           last_login: new Date()
//         },
//         $inc: {
//           login_count: 1
//         }
//       },
//       { upsert: true, returnOriginal: false },
//       (err, doc) => {
//         console.log(err)
//         console.log(doc)
//         return done(null, doc.value);
//       }
//     )
//   }
// ));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://social-panda.panda4817.repl.co/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);
    myDataBase.findOneAndUpdate(
      { id: profile.id },
      {
        $setOnInsert: {
          id: profile.id,
          username: profile.username || profile.displayName,
          created_on: new Date(),
          provider: profile.provider || ''
        },
        $set: {
          last_login: new Date()
        },
        $inc: {
          login_count: 1
        }
      },
      { upsert: true, returnOriginal: false },
      (err, doc) => {
        console.log(err)
        console.log(doc)
        return done(null, doc.value);
      }
    )
  }
));

}