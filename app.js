const express = require('express'),
    path = require('path'),
    app = express(),
    favicon = require('serve-favicon'),
    passport = require('passport'),
    ImgurStrategy = require('passport-imgur').Strategy,
    RedditStrategy = require('passport-reddit').Strategy,
    debug = process.argv.length > 2 ? process.argv[2].indexOf('--debug') > -1 : false,
    config = require('./config.js'),
    port = debug ? 8080 : config.port || 80;

var authTokens = {
    "imgur": {
        "default": {
            imgurAlbumHash: 'Y9PKtpI',
            imgurAuthorization: '79ea70333c45883',
            imgurRefreshToken: null,
            imgurAccessToken: null,
            imgurProfile: null
        },
        "pdx": {
            imgurAlbumHash: 'Y9PKtpI',
            imgurAuthorization: '79ea70333c45883',
            imgurRefreshToken: null,
            imgurAccessToken: null,
            imgurProfile: null
        }
    },
    "reddit": {
        redditRefreshToken: null,
        redditAccessToken: null,
        redditProfile: null
    }
}

function getSubdomainPrefix (req) {
    return req.subdomains.length ? req.subdomains[0] : "default";
}

function isValidRequestOrigin(req) {
    var origin = req.get('origin') || 'none';
    var subdomain = getSubdomainPrefix(req);
    var originIsValid = (origin == `http://${ subdomain == "default" ? '' : subdomain + '.' }biketag.org`) || (debug && origin == `http://localhost:${port}`);

    return originIsValid;
}

function templating(app) {

    app.use(express.static(path.join(__dirname, '/templates/biketag/')));
    app.use(favicon(path.join(__dirname, 'assets/', 'favicon.ico')));

    app.use("/assets", function(req, res) {
        var file = req.url = (req.url.indexOf('?') != -1) ? req.url.substring(0, req.url.indexOf('?')) : req.url;
        res.sendFile(path.join(__dirname, "assets/", req.url));
    });

    return app;
}

function authentication(app) {

    if (config.imgurClientID) {
        passport.use(new ImgurStrategy({
            clientID: config.imgurClientID,
            clientSecret: config.imgurClientSecret,
            callbackURL: config.imgurCallbackURL,
            passReqToCallback: true
            },
            function(req, accessToken, refreshToken, profile, done) {
                // FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
                // var subdomain = getSubdomainPrefix(req);
        
                // authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
                // authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
                // authTokens["imgur"][subdomain].imgurProfile = profile;
        
                for (var subdomain in authTokens["imgur"]) {
                    if (authTokens["imgur"].hasOwnProperty(subdomain)) {
                        authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
                        authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
                        authTokens["imgur"][subdomain].imgurProfile = profile;
                    }
                }
        
                // console.log('received imgur info', accessToken, refreshToken, profile);
                return done(null, profile);
            }
        ));

        // Imgur OAuth2 Integration
        app.get('/auth/imgur', passport.authenticate('imgur'));
        app.get('/auth/imgur/callback', passport.authenticate('imgur', { session: false, failureRedirect: '/fail', successRedirect: '/' }));
        app.post('/auth/imgur/getToken', function(req, res) {
            var subdomain = getSubdomainPrefix(req);
            var tokensValue = isValidRequestOrigin(req) ?  authTokens["imgur"][subdomain] : 'unauthorized access';

            // This will only return the imgur access token if the request is coming from the site itself
            res.json({ imgurTokens: tokensValue });
        });
    }

    if (config.redditClientID) {

        passport.use(new RedditStrategy({
            clientID: config.redditClientID,
            clientSecret: config.redditClientSecret,
            callbackURL: config.redditCallbackURL,
            passReqToCallback: true
            },
            function(req, accessToken, refreshToken, profile, done) {
                // FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
                // var subdomain = getSubdomainPrefix(req);
        
                // authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
                // authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
                // authTokens["imgur"][subdomain].imgurProfile = profile;
        
                for (var subdomain in authTokens["reddit"]) {
                    if (authTokens["reddit"].hasOwnProperty(subdomain)) {
                        authTokens["reddit"].imgurRefreshToken = refreshToken;
                        authTokens["reddit"].imgurAccessToken = accessToken;
                        authTokens["reddit"].imgurProfile = profile;
                    }
                }
        
                // console.log('received imgur info', accessToken, refreshToken, profile);
                return done(null, profile);
            }
        ));

        // Reddit OAuth2 Integration
        app.get('/auth/reddit', passport.authenticate('reddit'));
        app.get('/auth/reddit/callback', passport.authenticate('reddit', { session: false, failureRedirect: '/fail', successRedirect: '/' }));
        app.post('/auth/reddit/getToken', function(req, res) {
            var subdomain = getSubdomainPrefix(req);
            var tokensValue = isValidRequestOrigin(req) ?  authTokens["reddit"][subdomain] : 'unauthorized access';

            // This will only return the reddit access token if the request is coming from the site itself
            res.json({ redditTokens: tokensValue });
        });
    }

    return app;
}

function init(app) {
    app.use(passport.initialize());
    app.use(express.json());       // to support JSON-encoded bodies
    app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

    return app;
}

function run(app) {
    app.listen(port, function () {
            console.log("App listening on: http://localhost:" + port);
    });

    return app;
}

init(app);
templating(app);
authentication(app);
run(app);
