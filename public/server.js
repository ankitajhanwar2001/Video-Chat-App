// var express = require('express');
// var app = express();
// // var server = app.listen(8080);
// var server = require('http').Server(app);
// var io = require('socket.io')(server);
// const { v4: uuidV4 } = require('uuid');
// const { ExpressPeerServer } = require('peer');
// const peerServer = ExpressPeerServer(server, {
//     debug: true
// })

// app.set('view engine', 'ejs');
// app.use(express.static('public'));
// app.use('/peerjs', peerServer);

// var router = express.Router({ mergeParams: true });
// var middleware = require('../middleware/index');

// router.get('/room', middleware.isLoggedIn, function(req, res) {
//     console.log('/room');
//     res.redirect(`/${ uuidV4() }`);
// })

// router.get('/:roomId', middleware.isLoggedIn, function(req, res) {
//     console.log('/'+req.params.roomId);
//     res.render('room', { roomId: req.params.roomId });
// })

// io.on('connection', function(socket) {
//     socket.on('join-room', function(userId, roomId) {
//         console.log("&&&&&&&&&&&&&&&&&");
//         console.log(userId, roomId);
//         socket.join(roomId);
//         socket.broadcast.to(roomId).emit('user-connected', userId);

//         socket.on('disconnect', function() {
//             console.log('User disconnected');
//             socket.broadcast.to(roomId).emit('user-disconnected');
//         })
//     })
// })

// module.exports = router;