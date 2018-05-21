var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var path = require('path');
var routes = require('./routes/routes');
var Conversation = require('./models/Conversation')
var xor_crypt = require('xor-crypt')
var io_namespaces = {}

//connect to MongoDB
mongoose.connect('mongodb://localhost/joinchat');
var db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!
});

//use sessions for tracking logins
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// listen on port 3000
var server = app.listen(3003, function () {
  console.log('Express app listening on port 3003');
});



/*          SOCKET IO FUNCTIONS             */
var io = require('socket.io').listen(server);

io.on('connection', function(socket){
    socket.on('general', function(msg){
        io.emit('general', msg);
    });

    socket.on('init conv', function (msg) {
        console.log("new " + msg)
        if ( io_namespaces[msg] != null)
            return

        // replay to first person in room in order to force refresh
        // fix stupid bug from socket io

        socket.emit('init conv', 'ricardo');
        //flow normal
        console.log("reset");
        var nsp = io.of(msg);
        //console.log(nsp);
        nsp.on('connection', function(socket){
           socket.on('chat message', function(msg) {
            var enc = xor_crypt(msg, 2);
            console.log(enc);
              Conversation.update({_id: nsp.name.split("/")[1]}, {$push: {messages: {text: enc}}}, function (err, result) {
                console.log(result);
              })
              nsp.emit('chat message', msg)
           });
        });
        io_namespaces[msg] = nsp;
    });
});

