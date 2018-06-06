var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var randomstring = require('randomstring');
var mailer = require('../misc/mailer');

//var userID = "adminUser";

var User = require('../models/user');

// Register
router.get('/register', function (req, res) {
	res.render('register');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});

// Register User
router.post('/register', function (req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	console.log('OK');

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	console.log('OK');

	var errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors
		});
	}
	else {
		console.log('OK');
		//checking for email and username are already taken
		User.findOne({ username: { 
				"$regex": "^" + username + "\\b", "$options": "i"
			}},
			function (err, user) {
				User.findOne({ email: { 
					"$regex": "^" + email + "\\b", "$options": "i"
				}},
				function (err, mail) {
				if (user || mail) {
					res.render('register', {
						user: user,
						mail: mail
					});
				}
				else {
					var newUser = new User({
						name: name,
						email: email,
						username: username,
						password: password,
						secretToken: '',
						active: ''
					});
					console.log('OK');
					User.createUser(newUser, function (err, user) {
						if (err) throw err;
						//userID = user.id;
						console.log(user.id);
						//console.log(user);
					});
					req.flash('success_msg', 'You are registered but validate your Email to login');
					res.redirect('/users/login');
				}
			});
		});
	}
});

router.route('/verify')
  .get((req, res) => {
    res.render('verify');
  })
  .post(async (req, res, next) => {
    try {
      const { secretToken } = req.body;

      // Find account with matching secret token
      const user = await User.findOne({ 'secretToken': secretToken });
      if (!user) {
        req.flash('error', 'No user found.');
        res.redirect('/users/verify');
        return;
      }

      user.active = true;
      user.secretToken = '';
      await user.save();

      req.flash('success', 'Thank you! Now you may login.');
      res.redirect('/users/login');
    } catch(error) {
      next(error);
    }
  })


passport.use(new LocalStrategy(
	function (username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Unknown User' });
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					if(!user.active){
						return done(null, false, {message: 'Validate your Email first!'});
					}
					else
						return done(null, user);
				}
				else {
					return done(null, false, { message: 'Invalid password' });
				}
			});
		});
	}));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
	function (req, res) {
		res.redirect('/');
	});

router.get('/logout', function (req, res) {
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

module.exports = router;
//module.exports.userID = userID;
