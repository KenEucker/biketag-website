const express = require('express'),
    session = require('express-session'),
    path = require('path'),
    app = express(),
    setInterval = require('safe-timers').setInterval,
    favicon = require('serve-favicon'),
    passport = require('passport'),
    ImgurStrategy = require('passport-imgur').Strategy,
    RedditStrategy = require('passport-reddit').Strategy,
    refresh = require('passport-oauth2-refresh'),
    crypto = require('crypto'),
    debug = process.argv.length > 2 ? process.argv[2].indexOf('--debug') > -1 : false,
    config = require('./config.js'),
    regions = Object.keys(config.regions),
    port = debug ? 8080 : config.port || 80;

var authTokens = {};

function setVars() {
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

    console.log('using authentication vars:', authTokens);
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

function templating(templatePath) {

    if (!templatePath) {
        templatePath = path.join(__dirname, '/templates/biketag/');
    }

    console.log('configuring a static path to template:', templatePath);
    app.use(express.static(templatePath));
    app.use(favicon(path.join(__dirname, 'assets/', 'favicon.ico')));

    app.use("/assets", function(req, res) {
        console.log('asset requested', req.url);
        var file = req.url = (req.url.indexOf('?') != -1) ? req.url.substring(0, req.url.indexOf('?')) : req.url;
        res.sendFile(path.join(__dirname, "assets/", req.url));
    });
}

function security() {
    app.all('/*', function(req, res, next) {
        console.log('security check', req.url);
        // CORS headers
        res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
        // Set custom headers for CORS
        res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
        if (req.method == 'OPTIONS') {
            console.log('failed security check!', req.url);
            res.status(200).end();
        } else {
            next();
        }
    });
}

function authentication() {
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    if (config.imgurClientID) {
        console.log('configuring imgur API authentication for appID:', config.imgurClientID);

        var setImgurTokens = function (accessToken, refreshToken, profile) {
            // FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
            // var subdomain = getSubdomainPrefix(req);

            // authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
            // authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
            // authTokens["imgur"][subdomain].imgurProfile = profile;
    
            for (var subdomain of regions) {
                console.log('setting imgur authentication information for subdomain:', subdomain);
                authTokens[subdomain]["imgur"].imgurAccessToken = accessToken;
                authTokens[subdomain]["imgur"].imgurRefreshToken = authTokens[subdomain]["imgur"].imgurRefreshToken || refreshToken;
                authTokens[subdomain]["imgur"].imgurProfile = authTokens[subdomain]["imgur"].imgurProfile || profile;
            }
        };

        var imgurStrategy = new ImgurStrategy({
            clientID: config.imgurClientID,
            clientSecret: config.imgurClientSecret,
            callbackURL: config.imgurCallbackURL,
            passReqToCallback: true
            },
            function(req, accessToken, refreshToken, profile, done) {
                if (profile.email == config.imgurEmailAddress) {
                    console.log('imgur auth callback with valid profile', profile);
                    setImgurTokens(accessToken, refreshToken, profile);
                    return done(null, profile);
                } else {
                    // Someone else wants to authorize our app? Why?
                    console.log('Someone else wants to authorize our app? Why?', profile);
                }
        
                // console.log('received imgur info', accessToken, refreshToken, profile);
                return done();
            }
        );
        passport.use(imgurStrategy);
        refresh.use(imgurStrategy);

        var imgurRefreshFrequency = 29 * (1000 * 60 * 60 * 24); // 29 days
        imgurRefreshFrequency = 1000;
        var refreshImgurTokens = function() {
            var theRefreshTokenToUse = authTokens["default"]["imgur"].imgurRefreshToken;
            refresh.requestNewAccessToken('imgur', theRefreshTokenToUse, function(err, accessToken, refreshToken) {
                console.log('imgur access token has been refreshed', refreshToken);
                setImgurTokens(accessToken, refreshToken, null);
            });
        };
        setInterval(refreshImgurTokens, imgurRefreshFrequency);

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
        console.log('configuring reddit API authentication for appID:', config.redditClientID);

        var setRedditTokens = function (accessToken, refreshToken, profile) {
            // FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
            // var subdomain = getSubdomainPrefix(req);

            // authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
            // authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
            // authTokens["imgur"][subdomain].imgurProfile = profile;
    
            for (var subdomain of regions) {
                console.log('setting reddit authentication information for subdomain:', subdomain);
                authTokens[subdomain]["reddit"].redditAccessToken = accessToken;
                authTokens[subdomain]["reddit"].redditRefreshToken = authTokens[subdomain]["reddit"].redditRefreshToken || refreshToken;
                authTokens[subdomain]["reddit"].redditProfile = authTokens[subdomain]["reddit"].redditProfile || profile;
            }
        };

        var redditStrategy = new RedditStrategy({
            clientID: config.redditClientID,
            clientSecret: config.redditClientSecret,
            callbackURL: config.redditCallbackURL,
            passReqToCallback: true
            },
            function(req, accessToken, refreshToken, profile, done) {
                if (profile.name == config.redditUserName) {
                    console.log('reddit auth callback with valid profile', profile);
                    setRedditTokens(accessToken, refreshToken, profile);

                    return done(null, profile);
                } else {
                    console.log('Someone else wants to authorize our app? Why?', profile);
                    // Someone else wants to authorize our app? Why?
                }

                process.nextTick(function () {
                    return done();
                });
            }
        );

        var redditRefreshFrequency = 45 * (1000 * 60); // 45 minutes
        var refreshRedditTokens = function() {
            var theRefreshTokenToUse = authTokens["default"]["reddit"].redditRefreshToken;
            refresh.requestNewAccessToken('reddit', theRefreshTokenToUse, function(err, accessToken, refreshToken) {
                console.log('reddit access token has been refreshed', refreshToken);
                setRedditTokens(accessToken, refreshToken, null);
            });
        };
        setInterval(refreshRedditTokens, redditRefreshFrequency);

        passport.use(redditStrategy);
        refresh.use(redditStrategy);

        // Reddit OAuth2 Integration
        app.get('/auth/reddit', function(req, res, next){
            req.session.state = crypto.randomBytes(32).toString('hex');
            passport.authenticate('reddit', {
              state: req.session.state,
            })(req, res, next);
          });
        app.get('/auth/reddit/callback', function(req, res, next){
            // Check for origin via state token
            if (req.query.state == req.session.state){
              passport.authenticate('reddit', {
                successRedirect: '/',
                failureRedirect: '/fail'
              })(req, res, next);
            }
            else {
              next( new Error(403) );
            }
          });
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
    app.use(session({ secret: 'biketag', resave: false, saveUninitialized: true, }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.json());       // to support JSON-encoded bodies
    app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies
}

function run() {
    app.listen(port, function () {
            console.log("App listening on: http://localhost:" + port);
    });
}

init();
setVars();
security();
templating();
authentication();

run();
