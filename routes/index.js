var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var mongoose = require('mongoose');

var User = require('../models/user');
var Post = require('../models/upload');


var db = mongoose.connection;
// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	var resultArray = [];
	var userId = req.user.id;
	var cursor = db.collection('posts').find();
	cursor.forEach(function(doc, err){
		if(err) throw err;
		else {
			if(userId == doc.postedBy) {
				doc.deletePost = true;
			}
			for(i in doc.comment){
				if(userId == doc.comment[i].commentedBy){
					doc.comment[i].deleteComment = true;
				}
			}
			resultArray.push(doc);
		}
	}, function() {
		resultArray = resultArray.reverse();
		res.render('index', {items: resultArray, userId: userId});
	});
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		res.redirect('/users/login');
	}
}

router.post('/', function (req, res) {
	console.log(req.user.id);
	var imageurl = req.body.imageurl;
	var caption = req.body.caption;
	var newPost = new Post({
		imageurl: imageurl,
		caption: caption,
		postedBy: req.user.id,
		comment: [],
		deletePost: false
	});
	//console.log(user._id);
	newPost.save();
	res.redirect('/');
});

router.post('/comment/:id', function(req, res) {
	var comment = {body: req.body.comment, dateCreated: Date(Date.now()).toLocaleString(),
		 commentedBy: req.user.id, imageId: req.params.id, deleteComment: false};
	console.log(comment);
	db.collection('posts').updateOne({_id: objectId(req.params.id)},
	 {$push: {comment: comment}, function(err, doc) {
		 if(err) {
			 console.log('Something went wrong!');
		 }
		 else{
			 console.log(doc);
		 }
	 }
	});
	res.redirect('/');
});

router.post('/delete/:id', function(req, res) {
	var userId = req.user.id;
	db.collection('posts').deleteOne({_id: objectId(req.params.id),
		postedBy: userId
	});
	res.redirect('/');
});

router.post('/:imageId/:commentedBy/:body/:dateCreated', function(req, res) {
	console.log('userID: ' + req.user.id);
	var comment = {
		body: req.params.body,
        dateCreated: req.params.dateCreated,
		commentedBy: req.params.commentedBy
	};
	if(req.user.id == comment.commentedBy) {
		db.collection('posts').updateOne({_id: objectId(req.params.imageId)},
			{$pull: {comment: comment}
   		});
	}
	res.redirect('/');
});



module.exports = router;
