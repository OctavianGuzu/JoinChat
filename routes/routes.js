var express = require('express');
var router = express.Router();
var User = require('../models/user');
var https = require('https');
var async = require('async');
var Conversation = require('../models/Conversation')
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
			administrator: false,
			lat: 0.0,
			long: 0.0,
			profilePic: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Koala_climbing_tree.jpg/360px-Koala_climbing_tree.jpg"
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

	// For each new friend, we create a default conversation between the 2 :)
	// //TODO
    // Conversation.create({
	// 	messages : [],
	// 	users : [req.session.userId, req.query.friend_id]
	// })
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
	if (req.query.convID == null)
        req.query.convID = ""

    res.cookie('data', req.query.convID);
	res.render("chat");
});

router.post('/updateLocation', (req, res, next) => {
	// console.log(req.query);
	// req.query.pos.coords = JSON.parse(req.query.pos.coords); 
	var lat = req.query.lat;
	var long = req.query.long;

	//console.log(lat, long);

	User.updateOne({_id: req.session.userId}, {lat: lat, long: long}, function (err, result) {
		//console.log(err, result);
		res.json({err: err});
	})
})

router.post('/updateProfilePic', (req, res, next) => {
	var url = req.query.url;

	User.updateOne({_id: req.session.userId}, {profilePic: url}, function (err, result) {
		res.json({err: err});
	})
})

router.get('/getProfilePic', (req, res, next) => {
	User.findOne({_id: req.session.userId}, function (err, result) {
		res.json({user: result});
	})
})


router.get('/getCloseFriends', (req, res, next) => {
	User.find({}, function (err, result) {
		var close_friends = [];
		var current_user;

		for (var i = 0; i < result.length; i++)
			if (result[i]._id == req.session.userId)
				current_user = result[i];

		console.log(current_user);

		for (var i = 0; i < result.length; i++)
			if (Math.abs(result[i].lat - current_user.lat) < 10 &&
				Math.abs(result[i].long - current_user.long) &&
				result[i]._id != current_user._id)
				close_friends.push(result[i]);

		res.json({close_friends: close_friends});
	})
})

router.get('/newGroup', (req, res, next) => {
  	var groupData = {
  		title : req.query.groupTitle,
		users : [req.session.userId],
		admin: req.session.userId
	};

    Conversation.create(groupData, function (err, user) {
        if (err) {
            console.log("failed  " + err)
            res.json({error : true});
        } else {
            console.log("added")
            res.json({error : false});
        }
    })
});

router.get('/getUserGroups', (req, res, next) => {
    var conditions = {
        'users': req.session.userId
    };

    Conversation.find(conditions, function (err, grp) {
		if (err)
		{
			console.log("could not find");
			res.json({error : "not found"});
        }
		else
		{
			console.log("found");
			res.json(grp)
		}
    })
});

router.get('/addFriendToGroup', (req, res, next) =>{
	console.log(req.query.group);
    console.log(req.query.fr);


    User.findOne({ email: req.query.fr })
        .exec(function (err, user) {
            console.log(user)
            if (err || user == null) {
                console.trace(err);
                res.json({error : true});
                return err;
            }


    var conditions = {
        _id: req.query.group,
        'users': { $ne: user._id }
    };

    var update = {
        $addToSet: { users: [user._id]}
    };


    Conversation.findOneAndUpdate(conditions,
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
        })
});

router.get('/getConversationHistory', function (req, res, next) {
	var id = req.query.name;

	Conversation.find({_id: id}, function (err, result) {
		console.log(id, result);
		if (result)
			res.json({msgs: result[0].messages});
		else
			res.json({msgs: []})
	})
})

module.exports = router;
