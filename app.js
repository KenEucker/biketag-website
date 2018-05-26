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
        return done(null, profile);
    }
));

console.log(path.join(__dirname, '/templates/biketag/'));
app.use(express.static(path.join(__dirname, '/templates/biketag/')));
app.use(favicon(path.join(__dirname, 'assets/', 'favicon.ico')));
app.use(passport.initialize());
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

app.use("/assets", function(req, res) {
    var file = req.url = (req.url.indexOf('?') != -1) ? req.url.substring(0, req.url.indexOf('?')) : req.url;
    res.sendFile(path.join(__dirname, "assets/", req.url));
});

// Imgur OAuth2 Integration
app.get('/auth/imgur', passport.authenticate('imgur'));
app.get('/auth/imgur/callback', passport.authenticate('imgur', { session: false, failureRedirect: '/fail', successRedirect: '/' }));
app.post('/auth/imgur/getToken', function(req, res) {
    var origin = req.get('origin') || 'none';
    var tokenValue = origin == 'http://biketag.org' ?  imgurAccessToken : 'unauthorized access';

    // This will only return the imgur access token if the request is coming from the site itself
    res.json({ origin, imgurAccessToken: tokenValue });
});

app.listen(port, function () {
    console.log("App listening on: http://localhost:" + port);
});
