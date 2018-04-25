var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var MessageSchema = new mongoose.Schema({
    from: {
        type: Schema.ObjectId,
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
    }
});

var Message = mongoose.model('Message', MessageSchema);
module.exports = Message;

