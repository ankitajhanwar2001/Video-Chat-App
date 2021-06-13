const express = require("express");
const app = express();
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var methodOverride = require('method-override');
var mongoose = require('mongoose');

// app.use(flash());
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
let usercurrent;
let userCurrent;
const { addUser, removeUser, getUser, getUserInRoom, addRoom, removeRoom, roomFind } = require("./models/roomData");

app.use(require('express-session')({
    secret: 'Heyy',
    resave: false,
    saveUninitialize: false
}));
app.use(flash());

app.use(function(req, res, next) {
    res.locals.newUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

mongoose.connect("mongodb+srv://video-chat-app:ankita2001@cluster0.hgets.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",function(res,req){
   console.log("Database Connected");
 });
mongoose.set('useFindAndModify', false);

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

app.use(function(req, res, next) {
    res.locals.newUser = req.user;
    next();
});

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
    console.log(req.user);
    userCurrent = req.user;
    console.log(userCurrent);
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
            if(newUser.username.length == 0) {
                req.flash("error", "Invalid username");
            } else if(req.body.password.length == 0) {
                req.flash("error", "Invalid password");
            } else {
                req.flash("error", "A user with the given username is already registered");
            }
            res.redirect('/register');
        }
        passport.authenticate('local')(req, res, function() {
            req.flash("success", "Registered successfully!! Welcome to Video Chat App " + user.firstname + " " + user.lastname);
            res.redirect('/join');
        })
    })
})

// LOGIN
app.get('/login', function(req, res) {
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Invalid username or password.'
}), function(req, res) {
    userCurrent = req.user;
    User.find({ username: req.body.username }, function(err, user) {
        if(err) {
            console.log(err);
        } else {
            currentUsername = user[0];
            console.log(currentUsername);
        }
    })
    res.redirect('/join');
});

// LOGOUT
app.get('/logout', middleware.isLoggedIn, function(req, res) {
    req.logout();
    req.flash("success", "Logged you out");
    res.redirect('/');
})

// JOIN
app.get('/join', middleware.isLoggedIn, function(req, res) {
  console.log(req.user);
  console.log(userCurrent);
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
        req.flash("error", "Room doesn't exist.");
        res.redirect('/joinExisting');
    }
})

app.get('/user', function(req, res) {
    res.render('user_profile', { user: userData });
})

app.get('/myprofile/:id', function(req, res) {
    var user = getUser(req.params.id);
    console.log(req.params.id);
    console.log("&&&&&     "+req.user);
    res.render('my_profile', { user: user });
})

//EDIT
app.get("/profile/:id/edit", function(req, res) {
    var currentUser = getUser(req.params.id);
    User.find({ username: currentUser.username }, function(err, user) {
        if(err) {
            req.flash("error", "Something went wrong");
            console.log(err);
            res.redirect("/");
        } else {
            res.render("edit_profile", { user: user[0], id: req.params.id });
        }
    });

});

//UPDATE
app.put("/profile/:id", function(req, res) {
    // res.send(req.body);
    console.log(req.params.id);
    // res.redirect('/');
    var currentUser = getUser(req.params.id);
    // console.log("######3   "+currentUser);
    User.findOneAndUpdate({ username: currentUser.username }, req.body, function(err, user) {
        if(err) {
          req.flash("error", "Something went wrong");
        } else {
            currentUser.firstname = req.body.firstname;
            currentUser.lastname = req.body.lastname;
            currentUser.username = req.body.username;
            currentUser.email = req.body.email;
            res.render('my_profile', { user: currentUser });
        }
    });
});

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
            var flag = 0;
            for(var i=0; i<user.length; i++) {
                if(user[i].username.trim() === username.trim()) {
                    userData = user[i];
                    flag = 1;
                }
                if(user[i].id === userId) {
                    usercurrent = user[i];
                }
            }
            if(flag == 0) {
                console.log("Not found");
            } else {
                console.log(userData.username, usercurrent.username);
                socket.emit('user-data', userData, usercurrent);
            }
        })

        socket.on('my-profile', function(roomId) {
            var user = getUserInRoom(roomId);
            var flag = 0;
            // var mydata;
            for(var i=0; i<user.length; i++) {
                if(user[i].id === userId) {
                    usercurrent = user[i];
                    flag=1;
                    break;
                }
            }
            if(flag == 0) {
                console.log("Not found");
            } else {
                socket.emit('my-data', usercurrent);
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
