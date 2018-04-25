var express = require('express');
var router = express.Router();
var User = require('../models/user');
var https = require('https');
var async = require('async');
// GET route for reading data

router.get('/', function (req, res, next) {
  return res.render('login');
});

router.post('/', function (req, res, next) {
	var obj;
	for(key in req.body)
		obj = JSON.parse(key);
	var response = {
		err: false
	};

	if (obj.logemail && obj.logpassword) {
		
		User.authenticate(obj.logemail, obj.logpassword, function (error, user) {
			if (error || !user) {
		        response.err = true;
		        res.status(200).send(response);
			} else {
				req.session.userId = user._id;
				res.status(200).send(response);
			}
		})
	} else {
		res.status(200).send(null);
	}
})

router.get('/register', function (req, res, next) {
	res.render('register');
});

router.post('/register', function (req, res, next) {
	var obj;
	for(key in req.body)
		obj = JSON.parse(key);
	var response = {
		err: false
	};
	if (obj.password !== obj.passwordConf) {
		response.err = true;
		res.status(200).send(response);
		return;
	}

	if (obj.email &&
		obj.name &&
		obj.password &&
		obj.passwordConf) {
		var userData = {
			email: obj.email,
			name: obj.name,
			password: obj.password,
			administrator: false
		};

		User.create(userData, function (err, user) {
			if (err) {
				response.err = true;
				res.status(200).send(response);
			} else {
				req.session.userId = user._id;
               	res.status(200).send(response);
            }
		})
	} else {
		response.err = true;
		res.status(200).send(response);
	}
});

router.get('/index', function (req, res, next) {
	User.findById (req.session.userId)
		.exec(function (error, user) {
			if (error) {
				return next(error);
			} else {
				if (user == null) {
					return res.redirect('/');
				} else {
					return res.render('index');
				}
			}
		})
})

router.get('/logout', function (req, res, next) {
	console.log("here");
	if (req.session) {
		req.session.destroy(function (err) {
			if (err) {
				res.status(200).send(null);
			} else {
				res.redirect('/');
			}
		})
	}
})

router.get('/isAdmin', function (req, res, next) {
	User.findById(req.session.userId)
		.exec(function (err, user) {
			res.json(user.administrator);
		})
})

router.get('/getUserName', function (req, res, next) {
    User.findById(req.session.userId)
        .exec(function (err, user) {
            res.json(user.name);
        })
})

router.post('/addFriend', (req, res, next) => {
	var obj;
	for(key in req.body)
		obj = JSON.parse(key);
	var response = {
		err: false
	};

    var conditions = {
        _id: req.session.userId,
        'friends._id': { $ne: req.query.friend_id }
    };

    var update = {
        $addToSet: { friends: { _id : req.query.friend_id} }
    };

	User.findOneAndUpdate(conditions,
        update,
        function(err, model) {
            if (err) {
            	console.log(err);
            	res.json({error : true});
			}
			else {
            	res.json({error : false});
			}
        }
    );
});

router.get('/userInfo', (req, res,next) => {
	a = req.query.id;
	if (a == null)
		a = req.session.userId;

    User.findById(a)
        .exec(function (err, user) {
            res.json(user);
        })
});

router.get('/getUserFromEmail', (req, res, next) => {
	User.findOne({ email: req.query.emailf })
        .exec(function (err, user) {
        	console.log(user)
        	if (err || user == null) {
        		console.trace(err);
        		res.json({error : "Not found"})
            }
        	else
            	res.json(user);
        })
});

router.get('/chatView', (req, res, next) => {
    res.cookie('data', 123);
	res.render("chat");
});

module.exports = router;
