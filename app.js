const express = require("express");
const app = express();
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var methodOverride = require('method-override');
var mongoose = require('mongoose');

var middleware = require('./middleware/index');
var generatedMessage = require('./models/message');
var User = require('./models/user.js');
var Room = require('./models/room.js');

// Server
const server = require("http").Server(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 8080;
const { v4: uuidV4 } = require("uuid");
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

let currentUsername;
let redirectURL;
let userData;
const { addUser, removeUser, getUser, getUserInRoom, addRoom, removeRoom, roomFind } = require("./models/roomData");

app.use(require('express-session')({
    secret: 'Heyy',
    resave: false,
    saveUninitialize: false
}));

mongoose.connect("mongodb+srv://video-chat-app:ankita2001@cluster0.hgets.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",function(res,req){
   console.log("Database Connected");
 });


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded('extended: true'));
app.use(methodOverride('_method'));

app.use(express.static('public'));
app.use('/peerjs', peerServer);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ROUTES
// var indexRoutes = require('./public/index');
// var serverRoutes = require('./public/server');

// app.use(indexRoutes);
// app.use(serverRoutes);

app.get('/', function(req, res) {
    res.render('home.ejs');
})

//REGISTER
app.get('/register', function(req, res) {
    // console.log(req.body.username);
    res.render('register.ejs');
})

app.post('/register', function(req, res) {
    // currentUsername = req.body.username;
    console.log(currentUsername);
    console.log(req.body);
    var user = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        email: req.body.email,
    }
    currentUsername = user;
    var newUser = new User(user);
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            console.log("Error");
            res.redirect('/register');
        }
        passport.authenticate('local')(req, res, function() {
            res.redirect('/join');
        })
    })
})

// LOGIN
app.get('/login', function(req, res) {
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login'
}), function(req, res) {
    // username: req.body.username
    User.find({ username: req.body.username }, function(err, user) {
        if(err) {
            console.log('Error');
        } else {
            // console.log(user);
            currentUsername = user[0];
            // console.log(currentUsername);
        }
    })
    // currentUsername = req.body.username;
    res.redirect('/join');
});

// LOGOUT
app.get('/logout', middleware.isLoggedIn, function(req, res) {
    req.logout();
    res.redirect('/');
})

// JOIN
app.get('/join', middleware.isLoggedIn, function(req, res) {
    // console.log(currentUsername);
    res.render('join.ejs', { user: currentUsername });
})

app.post('/join', middleware.isLoggedIn, function(req, res) {
    var url = uuidV4();
    res.redirect(`/${ url }`);
})

app.get('/joinExisting', middleware.isLoggedIn, function(req, res) {
    // console.log(req.body);
    res.render('join.ejs');
})

app.post('/joinExisting', middleware.isLoggedIn, function(req, res) {
    console.log(req.body);
    var index = roomFind(req.body.existingRoom);
    if(index != -1) {
        res.redirect(`/${ req.body.existingRoom }`);
    } else {
        console.log('Does not exist');
        res.redirect('/joinExisting');
    }
})

app.get('/user', middleware.isLoggedIn, function(req, res) {
    res.render('user_profile', { user: userData });
})

app.get('/:roomId', middleware.isLoggedIn, function (req, res) {
    res.render('room', { roomId: req.params.roomId });
});

io.on('connection', function(socket) {

    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.join(userId);

        io.to(roomId).emit('newMessage', generatedMessage('Admin', 'Welcome to chat app!'));

        const { rooms } = addRoom(roomId);
        const { error, user } = addUser({
            id: userId,
            firstname: currentUsername.firstname,
            lastname: currentUsername.lastname,
            username: currentUsername.username,
            email: currentUsername.email,
            room: roomId
        })


        socket.broadcast.to(roomId).emit('user-connected', userId);
        socket.broadcast.to(roomId).emit('newMessage', generatedMessage('Admin', currentUsername.firstname + ' ' + currentUsername.lastname + ' joined'));

        socket.on('createMessage', function(message, callback) {
            if(message!='') {
                var user = getUser(userId);
                var name = user.firstname + " " + user.lastname;
                io.to(roomId).emit('newMessage', generatedMessage(name, message));
            }
            callback();
        })

        io.to(roomId).emit('no-of-participants', {
            room: roomId,
            users: getUserInRoom(roomId)
        })

        // Contacting specific user
        socket.on('sending-to-user', function(roomId, username, message) {
            var user = getUserInRoom(roomId);
            var data;
            var flag = 0;
            console.log(username);
            console.log("bbv  "+ username);
            for(var i=0; i<user.length; i++) {
                if(user[i].username.trim() === username.trim()) {
                    data = user[i];
                    flag = 1;
                    break;
                }
            }
            if(flag == 0) {
                console.log("Not found");
            } else {
                if(userId != data.id)
                io.to(data.id).emit('alert-message', message);
            }
        })

        socket.on('user-profile', function(roomId, username) {
            var user = getUserInRoom(roomId);
            console.log(user);
            console.log(username);
            // var userData;
            var flag = 0;
            for(var i=0; i<user.length; i++) {
                if(user[i].username.trim() === username.trim()) {
                    userData = user[i];
                    flag = 1;
                    break;
                }
            }
            if(flag == 0) {
                console.log("Not found");
            } else {
                socket.emit('user-data', userData);
            }
        })

        socket.on("user-disconnecting", function(userId) {
            socket.on('disconnect', function() {
                // console.log(io.sockets.adapter.rooms.get(roomId));
                if(io.sockets.adapter.rooms.get(roomId) == undefined) {
                    var room = removeRoom(roomId);
                }
                var user = removeUser(userId);

                if(user) {
                    io.to(user.room).emit('no-of-participants', {
                        room: roomId,
                        users: getUserInRoom(roomId)
                    })
                }
                socket.broadcast.to(roomId).emit('user-disconnected', userId);
            })
        })

        socket.on('disconnect', function() {
            // console.log(io.sockets.adapter.rooms.get(roomId).size);
            if(io.sockets.adapter.rooms.get(roomId) == undefined) {
                var room = removeRoom(roomId);
            }
            var user = removeUser(userId);
            if(user) {
                io.to(user.room).emit('no-of-participants', {
                    room: roomId,
                    users: getUserInRoom(roomId)
                })
            }
            socket.broadcast.to(roomId).emit('user-disconnected', userId);
        })

    });


});

server.listen(port, function() {
    console.log('Server is up.');
})
