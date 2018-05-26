const express = require('express'),
    path = require('path'),
    app = express(),
    favicon = require('serve-favicon'),
    passport = require('passport'),
    ImgurStrategy = require('passport-imgur').Strategy,
    port = 8080;

var imgurRefreshToken = null,
    imgurAccessToken = null,
    imgurProfile = null;

passport.use(new ImgurStrategy({
    clientID: '79ea70333c45883',
    clientSecret: '947d003902b25c7c8b72830898f9f5f07beddfb5',
    callbackURL: "http://biketag.org/auth/imgur/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        imgurRefreshToken = refreshToken;
        imgurAccessToken = accessToken;
        imgurProfile = profile;

        console.log('received imgur info', accessToken, refreshToken, profile);
        done();
    }
));

console.log(path.join(__dirname, '/templates/biketag/'));
app.use(express.static(path.join(__dirname, '/templates/biketag/')));
app.use(favicon(path.join(__dirname, 'assets/', 'favicon.ico')));

app.use("/assets", function(req, res) {
    var file = req.url = (req.url.indexOf('?') != -1) ? req.url.substring(0, req.url.indexOf('?')) : req.url;
    res.sendFile(path.join(__dirname, "assets/", req.url));
});

// Imgur OAuth2 Integration
app.get('/auth/imgur', passport.authenticate('imgur'));
app.get('/auth/imgur/callback', function(req, res, next) {
    console.log(req.url);
    passport.authenticate('imgur', function(err, user, info) {
        console.log("authenticate");
        console.log(err);
        console.log(user);
        console.log(info);
        // res.redirect(`/?refreshToken=${imgurRefreshToken}&accessToken=${accessToken}`);
    })(req, res, next);
  });

app.get('/fail', function(req, res) {
    res.write('url: ' + req.url);
    res.write('\r\nbody: ' + req.body);
    res.end();
});

app.listen(port, function () {
    console.log("App listening on: http://localhost:" + port);
});
