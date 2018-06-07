var mongoose = require('mongoose');

//Post Schema
var PostSchema = new mongoose.Schema({
	imageurl: {
		type: String,
		index:true
	},
	caption: {
		type: String
	},
    postedBy: {
		type: String
	},
	dateCreated: {type: Date,
	default: Date.now},
    comment: [
		{
			body:{type: String},
            dateCreated: {type: Date, default: Date.now},
			commentedBy:{type: String},
			imageId: {type: String},
			deletComment: {type: Boolean}
		}
	],
	deletPost: {type: Boolean}
});

var Post = module.exports = mongoose.model('Post', PostSchema);