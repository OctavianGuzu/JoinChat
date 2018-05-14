var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var ConversationSchema = new mongoose.Schema({


    messages: [{from: {
            type: Number,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        sent: {
            type: Date,
            required : true,
            default: Date.now()
        }}],
        users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
        title: {
            type : String,
            required : true
        },
        admin : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
});

var Conversation = mongoose.model('Conversation', ConversationSchema);
module.exports = Conversation;

