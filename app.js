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
	imgur = require('imgur'),
	gulp = require('gulp'),
	watch = require('gulp-watch'),
	gulpS3 = require('gulp-s3-upload'),
	config = require('./config.js'),
	debug = process.argv.length > 2 ? process.argv[2].indexOf('--debug') > -1 : config.debug || false,
	subdomains = Object.keys(config.subdomains),
	port = debug ? 8080 : config.port || 80;

var authTokens = {};

function setVars() {
	const getValueFromConfig = function (name, tokens) {
		// Assign the subdomain based value or use the default from the base cofig
		return tokens[name] || config[name];
	}

	for (var subdomain of subdomains) {
		var tokens = config.subdomains[subdomain];

		// Assign the subdomain based imgur authorization information, or use the default
		tokens["imgur"] = tokens["imgur"] || [];
		tokens["imgur"].imgurClientID = getValueFromConfig("imgurClientID", tokens["imgur"]);
		tokens["imgur"].imgurClientSecret = getValueFromConfig("imgurClientSecret", tokens["imgur"]);
		tokens["imgur"].imgurCallbackURL = getValueFromConfig("imgurCallbackURL", tokens["imgur"]);
		tokens["imgur"].imgurEmailAddress = getValueFromConfig("imgurEmailAddress", tokens["imgur"]);

		// Assign the subdomain based AWS S3 authorization information, or use the default
		tokens["s3"] = tokens["s3"] || [];
		tokens["s3"].cdnUrl = getValueFromConfig("AwsCdnUrl", tokens["s3"]);
		tokens["s3"].emailAddress = getValueFromConfig("emailAddress", tokens["s3"]);
		tokens["s3"].accessKeyId = getValueFromConfig("accessKeyId", tokens["s3"]);
		tokens["s3"].secretAccessKey = getValueFromConfig("secretAccessKey", tokens["s3"]);
		tokens["s3"].region = getValueFromConfig("region", tokens["s3"]);

		tokens["reddit"] = tokens["reddit"] || [];
		tokens["reddit"].redditClientID = getValueFromConfig("redditClientID", tokens["reddit"]);
		tokens["reddit"].redditClientSecret = getValueFromConfig("redditClientSecret", tokens["reddit"]);
		tokens["reddit"].redditCallbackURL = getValueFromConfig("redditCallbackURL", tokens["reddit"]);
		tokens["reddit"].redditUserName = getValueFromConfig("redditUserName", tokens["reddit"]);

		authTokens[subdomain] = tokens;
	}

	console.log('using authentication vars:', authTokens);
}

function getSubdomainPrefix(req) {
	return req.subdomains.length ? req.subdomains[0] : "default";
}

function isValidRequestOrigin(req) {
	var origin = req.get('origin') || 'none';
	var subdomain = getSubdomainPrefix(req);
	var originIsValid = (origin == `http://${subdomain == "default" ? '' : subdomain + '.'}biketag.org`) || (debug && origin == `http://localhost:${port}`);
	if (originIsValid) {
		console.log(`origin ${origin} is valid`);
	} else {
		console.error(`origin ${origin} is not valid`);
	}

	return originIsValid;
}

function getImagesByUploadDate(images, newestFirst) {
	if (!newestFirst) {
		return images.sort(function (image1, image2) {
			return new Date(image2.datetime) - new Date(image1.datetime);
		});
	} else {
		return images.sort(function (image1, image2) {
			return new Date(image1.datetime) - new Date(image2.datetime);
		});
	}
};

function getTagNumberIndex(images, tagNumber, proof = false) {
	var tagNumberIndex = ((images.length + 1) - (((tagNumber - (tagNumber % 2) + 1) * 2)));

	var verifyTagNumber = function (index) {
		let compare = `#${tagNumber} tag`;
		if (proof) {
			compare = `#${tagNumber} proof`;
		}
		return index > -1 ? images[index].description.indexOf(compare) != -1 : -1;
	};
	if (verifyTagNumber(tagNumberIndex)) {
		return tagNumberIndex;
	} else if (tagNumberIndex < (images.length + 1) && verifyTagNumber(tagNumberIndex + 1)) {
		return tagNumberIndex + 1;
	} else if (tagNumberIndex > 0 && verifyTagNumber(tagNumberIndex - 1)) {
		return tagNumberIndex - 1;
	}

	for (var i = 0; i < images.length; ++i) {
		if (verifyTagNumber(i)) { tagNumberIndex = i; break; }
	}

	return tagNumberIndex;
};

function biketagRedditTemplate(images, tagNumber) {
	const latestTagNumber = Number.parseInt(images[0].description.split(' ')[0].substr(1));
	tagNumber = tagNumber == 'latest' ? latestTagNumber : tagNumber;
	const prevTagNumber = tagNumber > 1 ? tagNumber - 1 : 1;
	const nextTagNumber = tagNumber > 1 ? tagNumber : 2;
	const nextTagIndex = getTagNumberIndex(images, nextTagNumber);
	const prevTagIndex = getTagNumberIndex(images, prevTagNumber, true);

	const proofTagURL = `https://imgur.com/${images[prevTagIndex].id}`;
	const nextTagURL = images[nextTagIndex].link;


	const split = images[prevTagIndex].description.split('by');
	const credit = split[split.length - 1].trim();
	const proofText = images[prevTagIndex].description;

	// console.log('setting image link', image.link, image);
	return `<pre>Credit goes to: ${credit} for finding tag #${prevTagNumber}!\r\n\r\n
[\#${nextTagNumber} tag by ${credit}](${nextTagURL})\r\n\r\n
[${proofText}](${proofTagURL})\r\n\r\n
[Rules](http://biketag.org/#howto)</pre>`;
}

function templating(templatePath) {
	if (!templatePath) {
		templatePath = path.join(__dirname, '/templates/pages/');
	}

	app.get("/get/reddit", function (req, res) {
		const tagnumber = req.tagnumber || 'latest';
		const subdomain = getSubdomainPrefix(req);
		const albumHash = authTokens[subdomain]["imgur"].imgurAlbumHash;

		console.log('reddit template request for tag', tagnumber);
		imgur.setClientId(authTokens[subdomain]["imgur"].imgurClientID);
		imgur.getAlbumInfo(albumHash)
			.then(function (json) {
				const images = getImagesByUploadDate(json.data.images);
				res.send(biketagRedditTemplate(images, tagnumber));
			})
			.catch(function (err) {
				console.error(err.message);
				res.send(err.message);
			});
	});
	app.use(express.static(templatePath));
	app.use("/assets", function (req, res) {
		console.log('asset requested', req.url);
		var file = req.url = (req.url.indexOf('?') != -1) ? req.url.substring(0, req.url.indexOf('?')) : req.url;
		res.sendFile(path.join(__dirname, "assets/", req.url));
	});
}

function security() {
	app.all('/*', function (req, res, next) {
		console.log('security check', req.url);
		// CORS headers
		res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
		// Set custom headers for CORS
		res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
		if (req.method == 'OPTIONS') {
			console.error('failed security check!', req.url);
			res.status(200).end();
		} else {
			next();
		}
	});
}

function authentication() {
	passport.serializeUser(function (user, done) {
		done(null, user);
	});

	passport.deserializeUser(function (obj, done) {
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

			for (var subdomain of subdomains) {
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
			function (req, accessToken, refreshToken, profile, done) {
				if (profile.email == config.imgurEmailAddress) {
					console.log('imgur auth callback with valid profile', profile);
					setImgurTokens(accessToken, refreshToken, profile);
					return done(null, profile);
				} else {
					// Someone else wants to authorize our app? Why?
					console.error('Someone else wants to authorize our app? Why?', profile.email, config.imgurEmailAddress);
				}

				// console.log('received imgur info', accessToken, refreshToken, profile);
				return done();
			}
		);
		passport.use(imgurStrategy);
		refresh.use(imgurStrategy);

		var imgurRefreshFrequency = 29 * (1000 * 60 * 60 * 24); // 29 days
		var refreshImgurTokens = function () {
			var theRefreshTokenToUse = authTokens["default"]["imgur"].imgurRefreshToken;
			console.log('attempting to refresh imgur access token using the refresh token:', theRefreshTokenToUse);
			refresh.requestNewAccessToken('imgur', theRefreshTokenToUse, function (err, accessToken, refreshToken) {
				console.log('imgur access token has been refreshed:', refreshToken);
				setImgurTokens(accessToken, refreshToken, null);
			});
		};
		setInterval(refreshImgurTokens, imgurRefreshFrequency);

		// Imgur OAuth2 Integration
		app.get('/auth/imgur', passport.authenticate('imgur'));
		app.get('/auth/imgur/callback', passport.authenticate('imgur', { session: false, failureRedirect: '/fail', successRedirect: '/' }));
		app.post('/auth/imgur/getToken', function (req, res) {
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

			for (var subdomain of subdomains) {
				console.log('setting reddit authentication information for subdomain:', subdomain);
				authTokens[subdomain]["reddit"].redditAccessToken = accessToken;
				authTokens[subdomain]["reddit"].redditRefreshToken = authTokens[subdomain]["reddit"].redditRefreshToken || refreshToken;
				authTokens[subdomain]["reddit"].redditProfile = authTokens[subdomain]["reddit"].redditProfile || profile;
				authTokens[subdomain]["reddit"].redditUserName = authTokens[subdomain]["reddit"].redditUserName || profile.name;
			}
		};

		var redditStrategy = new RedditStrategy({
			clientID: config.redditClientID,
			clientSecret: config.redditClientSecret,
			callbackURL: config.redditCallbackURL,
			passReqToCallback: true
		},
			function (req, accessToken, refreshToken, profile, done) {
				if (profile.name == config.redditUserName) {
					console.log('reddit auth callback with valid profile', profile);
					setRedditTokens(accessToken, refreshToken, profile);

					return done(null, profile);
				} else {
					console.error('Someone else wants to authorize our app? Why?', profile.name, config.redditUserName);
					// Someone else wants to authorize our app? Why?
				}

				process.nextTick(function () {
					return done();
				});
			}
		);

		var redditRefreshFrequency = 29 * (1000 * 60 * 60 * 24); // 29 days
		var refreshRedditTokens = function () {
			var theRefreshTokenToUse = authTokens["default"]["reddit"].redditRefreshToken;
			console.log('attempting to refresh reddit access token using the refresh token:', theRefreshTokenToUse);
			refresh.requestNewAccessToken('reddit', theRefreshTokenToUse, function (err, accessToken, refreshToken) {
				console.log('reddit access token has been refreshed:', refreshToken);
				setRedditTokens(accessToken, refreshToken, null);
			});
		};
		setInterval(refreshRedditTokens, redditRefreshFrequency);

		passport.use(redditStrategy);
		refresh.use(redditStrategy);

		// Reddit OAuth2 Integration
		app.get('/auth/reddit', function (req, res, next) {
			req.session.state = crypto.randomBytes(32).toString('hex');
			passport.authenticate('reddit', {
				state: req.session.state,
				duration: 'permanent'
			})(req, res, next);
		});
		app.get('/auth/reddit/callback', function (req, res, next) {
			// Check for origin via state token
			if (req.query.state == req.session.state) {
				passport.authenticate('reddit', {
					successRedirect: '/',
					failureRedirect: '/fail'
				})(req, res, next);
			}
			else {
				next(new Error(403));
			}
		});
		app.post('/auth/reddit/getToken', function (req, res) {
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

function ImgurIngestor() {

}

function RedditIngestor() {

}

function uploadFileToS3(config, file, basePath = 'biketag', metadataMap = {}) {
	const s3 = gulpS3(config);

	console.log(`watching folder for new uploads to S3:`, config.bucket);
	return gulp.src(file.path, { allowEmpty: true })
		.pipe(s3({
			Bucket: `${config.bucket}/${basePath}`,
			ACL: 'public-read',
			metadataMap,
		}, {
				maxRetries: 5
			}));
}

function syncUploadsToS3(config) {
	const s3 = gulpS3(config);

	console.log(`watching folder for new uploads to S3:`, config.bucket);
	return watch(config.bucket, {
		ignoreInitial: true,
		verbose: true,
		allowEmpty: true,
	}, function (file) {
		return gulp.src(file.path, { allowEmpty: true })
			.pipe(s3({
				Bucket: `${config.bucket}/biketag`,
				ACL: 'public-read',
				metadataMap: {
					"uploaded-by": config.bucket,
					"title": "title",
					"description": "description",
				},
			}, {
					maxRetries: 5
				}));
	});
}

function syncWithS3() {
	syncUploadsToS3(authTokens["pdx"]["s3"]);
}

function init() {
	app.use(session({ secret: 'biketag', resave: false, saveUninitialized: true, }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.json());                         // to support JSON-encoded bodies
	app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

	app.use(favicon(path.join(__dirname, 'assets/', 'favicon.ico')));
}

function run() {
	app.listen(port, function () {
		console.log("App listening on: http://localhost:" + port);
	});
}
/* configuration */
/*       / */ init();
/*      /  */ setVars();
/*     /   */ security();
// /*    /    */ syncWithS3();
/*   /     */ templating();
/*  /      */ authentication();
/* \/      */
run();
