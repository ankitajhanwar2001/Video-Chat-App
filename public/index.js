// var express = require("express");
// var router = express.Router({mergeParams: true});
// var passport = require("passport");
// const { v4: uuidV4 } = require("uuid");
// var User = require("../models/user");
// var middleware = require("../middleware/index");

// router.get('/', function(req, res) {
//     res.render('home.ejs');
// })

// //REGISTER
// router.get('/register', function(req, res) {
//     res.render('register.ejs');
// })

// router.post('/register', function(req, res) {
//     var newUser = new User({ username: req.body.username });
//     User.register(newUser, req.body.password, function(err, user) {
//         if(err) {
//             console.log("Error");
//             res.redirect('/register');
//         }
//         passport.authenticate('local')(req, res, function() {
//             // res.render('join.ejs');
//             res.redirect('/join');
//         })
//     })
// })

// // LOGIN
// router.get('/login', function(req, res) {
//     res.render('login.ejs');
// })

// router.post('/login', passport.authenticate('local', {
//     successRedirect: '/join',
//     failureRedirect: '/login'
// }), function(req, res) {

// });

// // LOGOUT
// router.get('/logout', middleware.isLoggedIn, function(req, res) {
//     req.logout();
//     res.redirect('/');
// })

// // JOIN
// router.get('/join', middleware.isLoggedIn, function(req, res) {
//     // console.log(req.body);
//     res.render('join.ejs');
// })

// router.post('/join', middleware.isLoggedIn, function(req, res) {
//     var url = uuidV4();
//     res.redirect(`/${ url }`);
// })

// router.get('/joinExisting', middleware.isLoggedIn, function(req, res) {
//     // console.log(req.body);
//     res.render('join.ejs');
// })

// router.post('/joinExisting', middleware.isLoggedIn, function(req, res) {
//     console.log(req.body);
//     res.redirect(`/${ req.body.existingRoom }`);
// })

// module.exports = router;