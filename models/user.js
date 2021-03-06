var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  friends :{
    type: [{_id : {type: mongoose.Schema.Types.ObjectId},
            group: {type: mongoose.Schema.Types.ObjectId, ref: 'Conversation'}}]
  },
  administrator: {
    type: Boolean,
    required: false
  },
  lat: {
    type: Number,
    required: false
  },
  long: {
    type: Number,
    required: false
  },
  profilePic: {
    type: String,
    required: false
  }
});

/**
 * Authenticate input against database
 * @param email
 * @param password
 * @param callback
 */
UserSchema.statics.authenticate = function (email, password, callback) {
  User.findOne({ email: email })
    .exec(function (err, user) {
      if (err) {
        return callback(err)
      } else if (!user) {
        var err = new Error('User not found.');
        err.status = 401;
        return callback(err);
      }
      bcrypt.compare(password, user.password, function (err, result) {
        if (result === true) {
          return callback(null, user);
        } else {
          return callback();
        }
      })
    });
};

/**
 * Hashing a password before saving it to the database
 */
UserSchema.pre('save', function (next) {
  var user = this;
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
});


var User = mongoose.model('User', UserSchema);
module.exports = User;

