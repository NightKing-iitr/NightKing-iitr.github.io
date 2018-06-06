var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var randomstring = require('randomstring');
var mailer = require('../misc/mailer');

var db = mongoose.connection;

// User Schema
var UserSchema = new mongoose.Schema({
	username: {
		type: String,
		index:true
	},
	password: {
		type: String
	},
	email: {
		type: String
	},
	name: {
		type: String
	},
	secretToken: {
		type: String
	},
    active: {
    	type: Boolean
	}
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        var secretToken = randomstring.generate();
	        newUser.secretToken = secretToken;
	        newUser.active = false;
			console.log('secretToken',secretToken);
			console.log('secret token generated');
			newUser.save(callback);//this is not working
			console.log('Hey this is not working!');
	        // Compose email
	        const html = `Hi there,
	        <br/>
	        Thank you for registering!
	        <br/><br/>
	        Please verify your email by typing the following token:
	        <br/>
	        Token: <b>${secretToken}</b>
	        <br/>
	        On the following page:
	        <a href="http://localhost:3000/users/verify">http://localhost:3000/users/verify</a>
	        <br/><br/>
	        Have a pleasant day.`
	        // Send email
      		mailer.sendEmail('admin@codeworkrsite.com', newUser.email, 'Please verify your email!', html);
	    });
	});
}

module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}
