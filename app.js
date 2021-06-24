require('dotenv/config');

const express = require("express");
const app = express();
const AWS = require('aws-sdk')
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var multer = require('multer');
var path = require('path');

var middleware = require('./middleware/index');
var generatedMessage = require('./models/message');
var User = require('./models/user.js');

// Server
const server = require("http").Server(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 8080;
const { v4: uuidV4 } = require("uuid");
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

const { addUser, updateUser, removeUser, getUser, getUserInRoom, addRoom, removeRoom, roomFind } = require("./models/roomData");
const { hasLowerCase, hasUpperCase, specialCharacters, length } = require("./models/passwordStrength");

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
})

var storage=multer.memoryStorage({
    destination: function(req, file, callback) {
        callback(null, '');
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})

var upload=multer({
    storage:storage,
    limits:{
        fileSize:1024*1024*5,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
          cb(null, true);
        } else {
          cb(null, false);
          return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
      }
}).single('image');

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.use(require('express-session')({
    secret: 'Heyy',
    resave: false,
    saveUninitialize: false
}));
app.use(flash());
app.use("/uploads",express.static("uploads"));

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
    res.render('register.ejs');
})

app.post('/register', function(req, res) {

  upload(req, res, (err) => {
     if(err) {
       console.log("Error");
       req.flash("error", "Something went wrong.");
     } else {
       var fileImage;
       if(req.file) {
           let myFile = req.file.originalname.split(".")
           const fileType = myFile[myFile.length - 1]

           const params = {
               Bucket: process.env.AWS_BUCKET_NAME,
               Key: `${uuidV4()}.${fileType}`,
               Body: req.file.buffer
           }

           s3.upload(params, (error, data) => {
               if(error){
                   res.status(500).send(error)
               } else {
                 var user = {
                      firstname: req.body.firstname,
                      lastname: req.body.lastname,
                      username: req.body.username,
                      email: req.body.email,
                      profileUrl: data.Location
                  }
                  var newUser = new User(user);

                  if(!hasLowerCase(req.body.password) || !hasUpperCase(req.body.password) || !specialCharacters(req.body.password) || !length(req.body.password)) {
                    req.flash("error", "Password must contain lowercase, uppercase, special characters and must be of atleast 8 characters.");
                    res.redirect('/register');
                  } else {
                    User.register(newUser, req.body.password, function(err, user) {
                        if(err) {
                            console.log("Error");
                            if(newUser && newUser.username.length == 0) {
                                req.flash("error", "Invalid username");
                            } else if(newUser && req.body.password.length == 0) {
                                req.flash("error", "Invalid password");
                            } else {
                                req.flash("error", "A user with the given username is already registered");
                            }
                            res.redirect('/register');
                        }
                        passport.authenticate('local')(req, res, function() {
                            req.flash("success", "Registered successfully!! Welcome to Video Chat App " + user.firstname + " " + user.lastname);
                            res.redirect(`/${user._id}/join`);
                        })
                    })
                  }
               }
           })

       } else {
         fileImage = 'https://profile-video-image-uploads.s3.ap-south-1.amazonaws.com/no_profile_picture.jpg';

         var user = {
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              username: req.body.username,
              email: req.body.email,
              profileUrl: fileImage
          }
          var newUser = new User(user);

          if(!hasLowerCase(req.body.password) || !hasUpperCase(req.body.password) || !specialCharacters(req.body.password) || !length(req.body.password)) {
            req.flash("error", "Password must contain lowercase, uppercase, special characters and must be of atleast 8 characters.");
            res.redirect('/register');
          } else {
            User.register(newUser, req.body.password, function(err, user) {
                if(err) {
                    console.log("Error");
                    if(newUser && newUser.username.length == 0) {
                        req.flash("error", "Invalid username");
                    } else if(newUser && req.body.password.length == 0) {
                        req.flash("error", "Invalid password");
                    } else {
                        req.flash("error", "A user with the given username is already registered");
                    }
                    res.redirect('/register');
                }
                passport.authenticate('local')(req, res, function() {
                    req.flash("success", "Registered successfully!! Welcome to Video Chat App " + user.firstname + " " + user.lastname);
                    res.redirect(`/${user._id}/join`);
                })
            })
          }
       }
     }
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
            req.flash('error', 'Invalid username or password.');
            res.redirect('/login');
        } else {
            res.redirect(`/${user[0]._id}/join`);
        }
    })
});

// LOGOUT
app.get('/logout', middleware.isLoggedIn, function(req, res) {
    req.logout();
    req.flash("success", "Logged you out");
    res.redirect('/');
})

// JOIN
app.get('/:id/join', middleware.isLoggedIn, function(req, res) {
    User.findById(req.params.id, function (err, user) {
      if(err) {
        req.flash("error", "Something went wrong.");
        res.redirect('/');
      } else {
        res.render('join.ejs', { user: user });
      }
    })
})

function generateUID() {
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}

app.post('/:id/join', middleware.isLoggedIn, function(req, res) {
    var url = generateUID();
    const { rooms } = addRoom(url);
    res.redirect(`/${req.params.id}/${ url }`);
})

app.get('/:id/joinExisting', middleware.isLoggedIn, function(req, res) {
    User.findById(req.params.id, function (err, user) {
      if(err) {
        req.flash("error", "Something went wrong.");
        res.redirect('/');
      } else {
        res.render('join.ejs', { user: user });
      }
    })
})

app.post('/:id/joinExisting', middleware.isLoggedIn, function(req, res) {
    var index = roomFind(req.body.existingRoom);
    var user = getUserInRoom(req.body.existingRoom);
    var size = user.length;
    if(index != -1) {
        if(size == 4) {
          req.flash("error", "Room is full.");
          res.redirect(`/${ req.params.id }/joinExisting`);
        } else {
          res.redirect(`/${req.params.id}/${ req.body.existingRoom }`);
        }
    } else {
        req.flash("error", "Room doesn't exist.");
        res.redirect(`/${ req.params.id }/joinExisting`);
    }
})

app.get('/user/:id', middleware.isLoggedIn, function(req, res) {
    User.findById(req.params.id, function (err, user) {
      if(err) {
        req.flash("error", "Something went wrong.");
        res.redirect('/');
      } else {
        res.render('user_profile', { user: user });
      }
    })
})

app.get('/myprofile/:id', middleware.isLoggedIn, function(req, res) {
    User.findById(req.params.id, function (err, user) {
      if(err) {
        req.flash("error", "Something went wrong.");
        res.redirect('/');
      } else {
        res.render('my_profile', { user: user });
      }
    })
})

//EDIT
app.get("/profile/:id/edit", middleware.isLoggedIn, function(req, res) {
    User.findById(req.params.id, function(err, user) {
        if(err) {
            req.flash("error", "Something went wrong");
            res.redirect("/");
        } else {
            res.render("edit_profile", { user: user, id: req.params.id });
        }
    });

});

//UPDATE
app.put("/profile/:id", middleware.isLoggedIn, function(req, res) {
      User.findByIdAndUpdate(req.params.id, req.body, function(err, user) {
          if(err) {
            req.flash("error", "Something went wrong");
          } else {
              var userupdate = updateUser({
                id: req.params.id,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                username: req.body.username,
                email: req.body.email
              })
              user.firstname = req.body.firstname;
              user.lastname = req.body.lastname;
              user.username = req.body.username;
              user.email = req.body.email;
              res.render('my_profile', { user: user });
          }
      });
});

app.get('/:id/:roomId', middleware.isLoggedIn, function (req, res) {
    User.findById(req.params.id, function (err, user) {
      if(err) {
        req.flash("error", "Room doesn't exist.");
        res.redirect(`/${req.params.id}/join`);
      } else {
        var index = roomFind(req.params.roomId);
        if(index != -1) {
            res.render('room', { roomId: req.params.roomId, user: user });
        } else {
            req.flash("error", "Room doesn't exist.");
            res.redirect(`/${req.params.id}/join`);
        }
      }
    })
});

io.on('connection', function(socket) {

    socket.on('join-room', function(roomId, userId, new_username) {

      // const userInRoom = getUserInRoom(roomId);
      // const size = userInRoom.length;
      // console.log(size);
      // if(size >= 1) {
      //   socket.emit('room-full');
      // }

        var new_user;
        User.find({ username: new_username }, function (err, user) {
          if(err) {
            console.log("Error");
          } else {
            new_user = user[0];
            if(new_user == undefined) {
              console.log("Error");
            } else {

            socket.join(userId);
            socket.join(roomId);

            const { user } = addUser({
                id: new_user._id,
                userId: userId,
                firstname: new_user.firstname,
                lastname: new_user.lastname,
                username: new_user.username,
                email: new_user.email,
                profileUrl: new_user.profileUrl,
                room: roomId
            })

            socket.emit('profile-image', user);
            socket.broadcast.to(roomId).emit('user-connected', userId, user);
            socket.broadcast.to(roomId).emit('alert-message', user.firstname + ' ' + user.lastname + ' joined');

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

            socket.on('update-participants', function (roomId) {
              io.to(roomId).emit('no-of-participants', {
                  room: roomId,
                  users: getUserInRoom(roomId)
              })
            });

            // Contacting specific user
            socket.on('sending-to-user', function(roomId, username, message) {
                var user = getUserInRoom(roomId);
                var data;
                var flag = 0;
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
                    if(userId != data.userId)
                    io.to(data.userId).emit('alert-message', message);
                }
            })

            socket.on('user-profile', function(roomId, username) {
                var user = getUserInRoom(roomId);
                var userData;
                var usercurrent;
                var flag = 0;
                for(var i=0; i<user.length; i++) {
                    if(user[i].username.trim() === username.trim()) {
                        userData = user[i];
                        flag = 1;
                    }
                    if(user[i].userId === userId) {
                        usercurrent = user[i];
                    }
                }
                if(flag == 0) {
                    console.log("Not found");
                } else {
                    socket.emit('user-data', userData, usercurrent);
                }
            })

            socket.on('my-profile', function(roomId) {
                var user = getUserInRoom(roomId);
                var flag = 0;
                var mydata;
                for(var i=0; i<user.length; i++) {
                    if(user[i].userId === userId) {
                        mydata = user[i];
                        flag=1;
                        break;
                    }
                }
                if(flag == 0) {
                    console.log("Not found");
                } else {
                    socket.emit('my-data', mydata);
                }
            })

            socket.on("user-disconnecting", function(userId) {
                socket.on('disconnect', function() {
                    if(io.sockets.adapter.rooms.get(roomId) == undefined) {
                        var room = removeRoom(roomId);
                    }
                    var user = removeUser(userId);

                    if(user) {
                        io.to(user.room).emit('no-of-participants', {
                            room: roomId,
                            users: getUserInRoom(roomId)
                        })
                        socket.broadcast.to(roomId).emit('user-disconnected', userId);
                        socket.broadcast.to(roomId).emit('alert-message', user.firstname + ' ' + user.lastname + ' left');
                    }
                })
            })

            socket.on('disconnect', function() {
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
                socket.broadcast.to(roomId).emit('alert-message', user.firstname + ' ' + user.lastname + ' left');
            })
          }

          }
        })
    });

});

server.listen(port, function() {
    console.log('Server is up.');
})
