const passport = require('passport');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const Filter = require('bad-words');
const filter = new Filter();
const ObjectID = require('mongodb').ObjectID;
 


module.exports = function (app, myDataBase, myPosts) {

  app.route('/').get((req, res, next) => {
    res.render('pug/index.pug', {
      title: "Can't be a social butterfly at the moment? Be a social panda!",
      message: 'Login or Register',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
      error: req.session.error,
      flash: req.flash('error'),
      uname: req.session.uname,
      pass: req.session.pass
    }, clearErrors(req));
  });


  function clearErrors(req) {
    req.session.uname = '';
    req.session.pass = '';
    req.session.error = '';
  }

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.session.error = 'An account is required to go to that page'
    res.redirect('/');
  };

  

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/', failureFlash: true }), (req, res) => {
    res.redirect('/posts');
  });

  function ensurePasswordCorrect(req, res, next) {
    clearErrors(req);
    var letterNumber = /^(?=.+\d)(?=.+[a-zA-Z])[^\s]{6,}$/g;
    const cleanUsername = filter.clean(req.body.username);
    if ((req.body.password.match(letterNumber)) && (req.body.password.length > 5) && (cleanUsername == req.body.username)){
      return next();
    } else {
      if (!(req.body.password.match(letterNumber))) {
        req.session.pass = "Password does NOT meet requirements";
        res.redirect('/');
        clearErrors(req);
        return;
      } else if (cleanUsername != req.body.username) {
        req.session.uname = "Make sure username is clean";
        res.redirect('/');
        clearErrors(req);
      }
      req.session.error = 'Something went wrong, try again :('
      res.redirect('/');
      clearErrors(req);
    }
    
  }

  app.route('/register')
    .post(ensurePasswordCorrect, (req, res, next) => {
      const hash = bcrypt.hashSync(req.body.password, 12);
      myDataBase.findOne({ username: req.body.username }, function(err, user) {
        if (err) {
          next(err);
        } else if (user) {
          clearErrors(req);
          req.session.uname = "Username taken";
          res.redirect('/');
        } else {
          myDataBase.insertOne({
            username: req.body.username,
            password: hash
          },
            (err, doc) => {
              if (err) {
                clearErrors(req);
                req.session.error = 'Something went wrong, try creating an account again after a few minutes';
                res.redirect('/');
              } else {
                clearErrors(req);
                next(null, doc.ops[0]);
              }
            }
          )
        }
      }),
      passport.authenticate('local', { failureRedirect: '/', failureFlash: true }),
      (req, res, next) => {
        res.redirect('/ppsts');
      }
    });

  app.route('/posts')
  .get(ensureAuthenticated, (req,res) => {
      const posts = myPosts.find().sort({posted_date: -1}).toArray(function(err, result) {
        if (err) {
          req.session.error = 'Something went wrong, try again later';
        }
        res.render(process.cwd() + '/views/pug/posts', {
          username: req.user.username,
          timeline: result,
          error: req.session.error
        }, clearErrors(req));
      })
      
  });

  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
  });

  app.route('/auth/github').get(passport.authenticate('github'));
  app.route('/auth/github/callback').get(passport.authenticate('github', { failureRedirect: '/', failureFlash: true }), (req, res) => {
    clearErrors(req);
    req.session.user_id = req.user.id
    res.redirect('/posts');
  });

  app.route('/post')
    .post((req, res) => {
      const txt = filter.clean(req.body.post);
      const hashtags = txt.match(/(#)([a-z]+)/g);
      myPosts.insertOne({
        userId: req.user._id,
        username: req.user.username,
        text: txt,
        posted_date: new Date(),
        likes: 0,
        tags: hashtags,
        whoLiked: [null]
      }, (err, doc) => {
        clearErrors(req); 
        if (err) {
          req.session.error = 'Something went wrong, try again later';
          res.redirect('/posts')
        } else {
          res.redirect('/posts')
        }
      })
    })
  
  app.route('/like')
    .post((req, res) => {
      myPosts.findOne({_id: new ObjectID(req.body.postId)}, function(err, doc) {
        console.log(doc)
        if (!doc.whoLiked.includes(req.user.username)) {
          myPosts.findOneAndUpdate({
            _id: new ObjectID(req.body.postId)
          },
          {
            $inc: {
              likes: 1
            },
            $push: {
              whoLiked: req.user.username
            }

          },
          function(err, doc) {
            clearErrors(req); 
            if (err) {
              req.session.error = 'Something went wrong, try again later';
              res.redirect('/posts')
            } else {
              res.redirect('/posts')
            }
          })
        } else {
          req.session.error = 'Already liked';
          res.redirect('/posts')
        }
      })
    })

    app.route('/delete')
    .post((req, res) => {
      myPosts.findOneAndDelete({_id: new ObjectID(req.body.postId)}, function(err, doc) {
        req.session.error = 'Post is removed'
        res.redirect('/posts')
      })
    })

    app.route('/chat')
      .get(ensureAuthenticated, (req, res) => {
        res.render(process.cwd() + '/views/pug/chat', {
          user: req.user
        }, clearErrors(req))
      })
    
    app.route('/unlike')
      .post((req, res) => {
          myPosts.findOne({_id: new ObjectID(req.body.postId)}, function(err, doc) {
          console.log(doc)
          if (doc.whoLiked.includes(req.user.username)) {
            myPosts.findOneAndUpdate({
              _id: new ObjectID(req.body.postId)
            },
            {
              $inc: {
                likes: -1
              },
              $pullAll: {
                whoLiked: [req.user.username]
              }

            },
            function(err, doc) {
              clearErrors(req); 
              if (err) {
                req.session.error = 'Something went wrong, try again later';
                res.redirect('/posts')
              } else {
                res.redirect('/posts')
              }
            })
          }
        })
      })

  app.route('/auth/facebook').get(passport.authenticate('facebook'));
  app.route('/auth/facebook/callback').get(passport.authenticate('facebook', { failureRedirect: '/', failureFlash: true }), (req, res) => {
    clearErrors(req);
    req.session.user_id = req.user.id
    res.redirect('/posts');
  });

  app.route('/auth/google')
    .get(passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/userinfo.profile' }));
  
  app.route('/auth/google/callback')
    .get(passport.authenticate('google', { failureRedirect: '/', failureFlash: true }),
    (req, res) => {
    clearErrors(req);
    req.session.user_id = req.user.id
    res.redirect('/posts');
  });

}