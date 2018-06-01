const express = require('express'),
    path = require('path'),
    app = express(),
    favicon = require('serve-favicon'),
    passport = require('passport'),
    ImgurStrategy = require('passport-imgur').Strategy,
    RedditStrategy = require('passport-reddit').Strategy,
    debug = process.argv.length > 2 ? process.argv[2].indexOf('--debug') > -1 : false,
    config = require('./config.js'),
    regions = Object.keys(config.regions),
    port = debug ? 8080 : config.port || 80;

var authTokens = {};

for(var region of regions) {
    var tokens = config.regions[region];

    // Assign the region based imgur authorization information, or use the default
    tokens["imgur"].imgurClientID =  tokens["imgur"].imgurClientID || config.imgurClientID;
    tokens["imgur"].imgurClientSecret = tokens["imgur"].imgurClientSecret || config.imgurClientSecret;
    tokens["imgur"].imgurCallbackURL = tokens["imgur"].imgurCallbackURL || config.imgurCallbackURL;
    tokens["imgur"].imgurEmailAddress = tokens["imgur"].imgurEmailAddress || config.imgurEmailAddress;
    
    // Assign the region based reddit authorization information, or use the default
    tokens["reddit"].redditClientID = tokens["reddit"].redditClientID || config.redditClientID;
    tokens["reddit"].redditClientSecret = tokens["reddit"].redditClientSecret || config.redditClientSecret;
    tokens["reddit"].redditCallbackURL = tokens["reddit"].redditCallbackURL || config.redditCallbackURL;
    tokens["reddit"].redditEmailAddress = tokens["reddit"].redditEmailAddress || config.redditEmailAddress;
    
    authTokens[region] = tokens;
}

function getSubdomainPrefix (req) {
    return req.subdomains.length ? req.subdomains[0] : "default";
}

function isValidRequestOrigin(req) {
    var origin = req.get('origin') || 'none';
    var subdomain = getSubdomainPrefix(req);
    var originIsValid = (origin == `http://${ subdomain == "default" ? '' : subdomain + '.' }biketag.org`) || (debug && origin == `http://localhost:${port}`);
    console.log(`origin ${origin} is ${ originIsValid ? '' : 'not ' }valid`);

    return originIsValid;
}

function templating() {

    app.use(express.static(path.join(__dirname, '/templates/biketag/')));
    app.use(favicon(path.join(__dirname, 'assets/', 'favicon.ico')));

    app.use("/assets", function(req, res) {
        // console.log('asset requested', req.url);
        var file = req.url = (req.url.indexOf('?') != -1) ? req.url.substring(0, req.url.indexOf('?')) : req.url;
        res.sendFile(path.join(__dirname, "assets/", req.url));
    });
}

function security() {
    app.all('/*', function(req, res, next) {
        // console.log('security check');
        // CORS headers
        res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
        // Set custom headers for CORS
        // res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
        if (req.method == 'OPTIONS') {
            res.status(200).end();
        } else {
            next();
        }
    });
}

function authentication() {

    if (config.imgurClientID) {
        console.log('configuring imgur API authentication for appID:', config.imgurClientID);

        passport.use(new ImgurStrategy({
            clientID: config.imgurClientID,
            clientSecret: config.imgurClientSecret,
            callbackURL: config.imgurCallbackURL,
            passReqToCallback: true
            },
            function(req, accessToken, refreshToken, profile, done) {
                console.log('imgur callback called');
                if (profile.email_address == config.imgurEmailAddress) {
                    // FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
                    // var subdomain = getSubdomainPrefix(req);
        
                    // authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
                    // authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
                    // authTokens["imgur"][subdomain].imgurProfile = profile;
            
                    for (var subdomain in regions) {
                        authTokens[subdomain]["imgur"].imgurRefreshToken = refreshToken;
                        authTokens[subdomain]["imgur"].imgurAccessToken = accessToken;
                        authTokens[subdomain]["imgur"].imgurProfile = profile;
                    }

                    return done(null, profile);
                } else {
                    // Someone else wants to authorize our app? Why?
                }
        
                // console.log('received imgur info', accessToken, refreshToken, profile);
                return done();
            }
        ));

        // Imgur OAuth2 Integration
        app.get('/auth/imgur', passport.authenticate('imgur'));
        app.get('/auth/imgur/callback', passport.authenticate('imgur', { session: false, failureRedirect: '/fail', successRedirect: '/' }));
        app.post('/auth/imgur/getToken', function(req, res) {
            var subdomain = getSubdomainPrefix(req);
            var tokensValue = 'unauthorized access';
            
            if (isValidRequestOrigin(req)) {
                tokensValue = {
                    imgurRefreshToken: authTokens[subdomain]["imgur"].imgurRefreshToken,
                    imgurAccessToken: authTokens[subdomain]["imgur"].imgurAccessToken,
                    imgurProfile: authTokens[subdomain]["imgur"].imgurProfile
                };
            }
            // This will only return the imgur access token if the request is coming from the site itself
            res.json({ imgurTokens: tokensValue });
        });
    }

    if (config.redditClientID) {
        console.log('configuring redit API authentication for appID:', config.redditClientID);
        
        passport.use(new RedditStrategy({
            clientID: config.redditClientID,
            clientSecret: config.redditClientSecret,
            callbackURL: config.redditCallbackURL,
            passReqToCallback: true
            },
            function(req, accessToken, refreshToken, profile, done) {
                console.log('reddit callback called');
                if (profile.email_address == config.redditEmailAddress) {
                    // FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
                    // var subdomain = getSubdomainPrefix(req);
        
                    // authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
                    // authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
                    // authTokens["imgur"][subdomain].imgurProfile = profile;
            
                    for (var subdomain in regions) {
                        authTokens[subdomain]["reddit"].redditRefreshToken = refreshToken;
                        authTokens[subdomain]["reddit"].redditAccessToken = accessToken;
                        authTokens[subdomain]["reddit"].redditProfile = profile;
                    }

                    return done(null, profile);
                } else {
                    // Someone else wants to authorize our app? Why?
                }

                return done();
            }
        ));

        // Reddit OAuth2 Integration
        app.get('/auth/reddit', passport.authenticate('reddit'));
        app.get('/auth/reddit/callback', passport.authenticate('reddit', { session: false, failureRedirect: '/fail', successRedirect: '/' }));
        app.post('/auth/reddit/getToken', function(req, res) {
            var subdomain = getSubdomainPrefix(req);
            var tokensValue = 'unauthorized access';

            if (isValidRequestOrigin(req)) {
                tokensValue = {
                    redditRefreshToken: authTokens[subdomain]["reddit"].redditRefreshToken,
                    redditAccessToken: authTokens[subdomain]["reddit"].redditAccessToken,
                    redditProfile: authTokens[subdomain]["reddit"].redditProfile
                };
            }

            // This will only return the reddit access token if the request is coming from the site itself
            res.json({ redditTokens: tokensValue });
        });
    }
}

function init() {
    app.use(passport.initialize());
    app.use(express.json());       // to support JSON-encoded bodies
    app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
}

function run() {
    app.listen(port, function () {
            console.log("App listening on: http://localhost:" + port);
    });
}

init();
security();
templating();
authentication();
run();
