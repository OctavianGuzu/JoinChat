var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var User = require('user')
var Message = require('message')


var ConversationSchema = new mongoose.Schema({


    messages: [Message],
    users: [User]
});

var Conversation = mongoose.model('Conversation', ConversationSchema);
module.exports = Message;

