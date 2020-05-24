const express = require('express')
const session = require('express-session')
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')

const app = express()
const {
	setInterval,
} = require('safe-timers')
const favicon = require('serve-favicon')
const passport = require('passport')
const {
	Strategy: ImgurStrategy,
} = require('passport-imgur')
const {
	Strategy: RedditStrategy,
} = require('passport-reddit')

const refresh = require('passport-oauth2-refresh')
const imgur = require('imgur')
const gulp = require('gulp')
const watch = require('watch')
const gulpWatch = require('gulp-watch')
const gulpS3 = require('gulp-s3-upload')
const http = require('http')
const reload = require('reload')
let config = require('./config.json')

const subdomains = Object.keys(config.subdomains)

const authTokens = {};

// Never let debug mode run in production
let debug = process.argv.length > 2 ? process.argv[2].indexOf('--debug') > -1 : config.debug || false;
debug = process.env.NODE_ENV !== 'production' ? debug : false;

if (debug) {
	config = Object.assign({}, config, require('./config.debug'))
}

const port = debug ? 8080 : config.port || 80;

function setVars() {
	const getValueFromConfig = function (name, tokens) {
		// Assign the subdomain based value or use the default from the base cofig
		return tokens[name] || config[name];
	}

	for (const subdomain of subdomains) {
		const tokens = config.subdomains[subdomain];

		// Assign the subdomain based imgur authorization information, or use the default
		tokens.imgur = tokens.imgur || [];
		tokens.imgur.imgurClientID = getValueFromConfig('imgurClientID', tokens.imgur);
		tokens.imgur.imgurClientSecret = getValueFromConfig('imgurClientSecret', tokens.imgur);
		tokens.imgur.imgurCallbackURL = getValueFromConfig('imgurCallbackURL', tokens.imgur);
		tokens.imgur.imgurEmailAddress = getValueFromConfig('imgurEmailAddress', tokens.imgur);

		// Assign the subdomain based AWS S3 authorization information, or use the default
		tokens.s3 = tokens.s3 || [];
		tokens.s3.cdnUrl = getValueFromConfig('AwsCdnUrl', tokens.s3);
		tokens.s3.emailAddress = getValueFromConfig('emailAddress', tokens.s3);
		tokens.s3.accessKeyId = getValueFromConfig('accessKeyId', tokens.s3);
		tokens.s3.secretAccessKey = getValueFromConfig('secretAccessKey', tokens.s3);
		tokens.s3.region = getValueFromConfig('region', tokens.s3);

		tokens.reddit = tokens.reddit || [];
		tokens.reddit.redditClientID = getValueFromConfig('redditClientID', tokens.reddit);
		tokens.reddit.redditClientSecret = getValueFromConfig('redditClientSecret', tokens.reddit);
		tokens.reddit.redditCallbackURL = getValueFromConfig('redditCallbackURL', tokens.reddit);
		tokens.reddit.redditUserName = getValueFromConfig('redditUserName', tokens.reddit);

		authTokens[subdomain] = tokens;
	}

	console.log('using authentication vars:', authTokens);
}

function getPublicConfigurationValues(subdomain) {
	// Only return what can be injected onto the page
	const thisSubdomain = !!subdomain ? config.subdomains[subdomain] : null
	const easter = !!thisSubdomain ? thisSubdomain.easter : null
	const adminEmailAddresses = config.adminEmailAddresses
	const images = thisSubdomain.images
	const supportedRegionals = config.supportedRegionals

	const out = {
		SUBDOMAIN: subdomain.toUpperCase(),
		thisSubdomain: subdomain,
		subdomains,
		supportedRegionals,
		adminEmailAddresses,
		easter,
		images,
	}

	return out
}

function getSubdomainPrefix(req, returnAlias = false) {
	const defaultSubdomain = req.subdomains.length ? req.subdomains[0] : 'default'
	const localhostSubdomainEnd = req.headers.host.indexOf('.')
	const localhostOverride = localhostSubdomainEnd !== -1 ? req.headers.host.substr(0, localhostSubdomainEnd) : null
	const alias = !!localhostOverride ? localhostOverride : defaultSubdomain

	return returnAlias ? alias : getSubdomainFromAlias(alias)
}

function getSubdomainFromAlias(alias) {
	let baseSubdomain

	Object.keys(config.subdomains).forEach((baseName) => {
		const aliases = config.subdomains[baseName].aliases || []
		if (alias === baseName || aliases.indexOf(alias) !== -1) {
			baseSubdomain = baseName
			return
		}
	})

	return baseSubdomain
}

function getTemplateNameFromSubdomain(subdomain) {
	return config.subdomains[subdomain].template
}

function isValidRequestOrigin(req) {
	const origin = req.get('origin') || 'none';
	const subdomain = getSubdomainPrefix(req, true)
	const subdomainPrefix = `${subdomain == 'default' ? '' : `${subdomain}.`}`
	const path = ''
	const reconstructedUrl = `${req.protocol}://${subdomainPrefix}localhost${path}:${port}`
	const localhostPortIsTheSameForDebugging = origin === reconstructedUrl
	const originIsCorrectSubdomain = origin == `http://${subdomainPrefix}biketag.org`
	const originIsValid = originIsCorrectSubdomain || localhostPortIsTheSameForDebugging;

	if (originIsValid) {
		console.log(`origin ${origin} is valid`);
	} else {
		console.error(`origin ${origin} is not valid`, {
			localhostPortIsTheSameForDebugging,
			originIsCorrectSubdomain,
			reconstructedUrl,
			originIsValid,
			subdomain,
			origin,
		});
	}

	return originIsValid;
}

function getImagesByUploadDate(images, newestFirst) {
	if (!newestFirst) {
		return images.sort((image1, image2) => new Date(image2.datetime) - new Date(image1.datetime));
	}
	return images.sort((image1, image2) => new Date(image1.datetime) - new Date(image2.datetime));
}

function getTagNumberIndex(images, tagNumber, proof = false) {
	const tagNumberIndex = ((images.length + 1) - (((tagNumber - (tagNumber % 2) + 1) * 2)));

	const verifyTagNumber = function (index) {
		let compare = `#${tagNumber} tag`;
		if (proof) {
			compare = `#${tagNumber} proof`;
		}
		return index > -1 ? images[index].description.indexOf(compare) !== -1 : false;
	};

	if (verifyTagNumber(tagNumberIndex)) {
		return tagNumberIndex;
	}
	if (tagNumberIndex < (images.length + 1) && verifyTagNumber(tagNumberIndex + 1)) {
		return tagNumberIndex + 1;
	}
	if (tagNumberIndex > 0 && verifyTagNumber(tagNumberIndex - 1)) {
		return tagNumberIndex - 1;
	}

	for (let i = 0; i < images.length; ++i) {
		if (verifyTagNumber(i)) {
			return i;
			break;
		}
	}

	return -1;
}

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

function templateRendering(app) {

	/// Check for an ejs file in the request, if no file exists then continue on to the next
	app.get("/", (req, res, next) => {
		res.render("index")
		next
	})

}

function templating(templatePath = path.join(__dirname, '/templates/'), supportRendering = true) {

	if (supportRendering) {
		//Set view engine to ejs
		app.set("view engine", "ejs")

		//Tell Express where we keep our index.ejs
		app.set("views", path.join(__dirname, "views"))

		//Use body-parser
		app.use(bodyParser.urlencoded({
			extended: false
		}))
	}

	app.get('/', (req, res) => {
		const subdomain = getSubdomainPrefix(req)

		if (!subdomain) {
			const host = req.headers.host
			const hostSubdomainEnd = host.indexOf('.') + 1
			const redirectToHost = `${req.protocol}://${host.substring(hostSubdomainEnd)}`

			console.log({
				subdomain,
				hostNotFound: host,
				redirectToHost
			})

			return res.redirect(redirectToHost)
		}

		const template = getTemplateNameFromSubdomain(subdomain)
		const landingPageTemplate = path.join(templatePath, template, 'index')

		if (supportRendering && fs.existsSync(`${landingPageTemplate}.ejs`)) {

			console.log('attempting to run renderer')

			return res.render(landingPageTemplate, getPublicConfigurationValues(subdomain))
		}

		const landingPageFile = path.join(templatePath, template, 'index.html')
		console.log('serving html file', landingPageFile)
		return res.sendFile(landingPageFile);
	})

	app.get('/get/reddit', (req, res) => {
		const tagnumber = req.query.tagnumber || 'latest';
		const subdomain = getSubdomainPrefix(req);
		const albumHash = authTokens[subdomain].imgur.imgurAlbumHash;

		console.log('reddit template request for tag', tagnumber);
		imgur.setClientId(authTokens[subdomain].imgur.imgurClientID);
		imgur.getAlbumInfo(albumHash)
			.then((json) => {
				const images = getImagesByUploadDate(json.data.images);
				res.send(biketagRedditTemplate(images, tagnumber));
			})
			.catch((err) => {
				console.error(err.message)
				res.send(err.message)
			})
	})
	Object.keys(config.subdomains).forEach((subdomain) => {
		const subdomainTemplate = config.subdomains[subdomain].template
		const subdomainTemplatePath = path.join(templatePath, subdomainTemplate)

		if (fs.existsSync(subdomainTemplatePath)) {
			console.log(`configuring static path for subdomain: ${subdomain}`, subdomainTemplatePath)

			app.use(express.static(subdomainTemplatePath))
		}
	})

	const baseOverride = path.join(templatePath, 'base')
	console.log(`configuring static path for the base override files`, baseOverride)
	app.use(express.static(baseOverride))

	app.use('/assets', (req, res) => {
		if (false) console.log('asset requested', req.url);
		const file = req.url = (req.url.indexOf('?') != -1) ? req.url.substring(0, req.url.indexOf('?')) : req.url;
		res.sendFile(path.join(__dirname, 'assets/', req.url));
	});

	console.log('finished templating set up for path', templatePath);
}

function security() {
	app.all('/*', (req, res, next) => {
		if (config.debug) console.log('security check', req.url)

		// CORS headers
		res.header('Access-Control-Allow-Origin', '*'); // restrict it to the required domain
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

	console.log('request security enabled')
}

function authentication() {
	passport.serializeUser((user, done) => {
		done(null, user);
	});

	passport.deserializeUser((obj, done) => {
		done(null, obj);
	});

	if (config.imgurClientID) {
		console.log('configuring imgur API authentication for appID:', config.imgurClientID);

		const setImgurTokens = function (accessToken, refreshToken, profile) {
			// FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
			// var subdomain = getSubdomainPrefix(req);

			// authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
			// authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
			// authTokens["imgur"][subdomain].imgurProfile = profile;

			for (const subdomain of subdomains) {
				console.log('setting imgur authentication information for subdomain:', subdomain);
				authTokens[subdomain].imgur.imgurAccessToken = accessToken;
				authTokens[subdomain].imgur.imgurRefreshToken = authTokens[subdomain].imgur.imgurRefreshToken || refreshToken;
				authTokens[subdomain].imgur.imgurProfile = authTokens[subdomain].imgur.imgurProfile || profile;
			}
		};

		const imgurStrategy = new ImgurStrategy({
				clientID: config.imgurClientID,
				clientSecret: config.imgurClientSecret,
				callbackURL: config.imgurCallbackURL,
				passReqToCallback: true,
			},
			((req, accessToken, refreshToken, profile, done) => {
				if (profile.email == config.imgurEmailAddress) {
					console.log('imgur auth callback with valid profile', profile);
					setImgurTokens(accessToken, refreshToken, profile);
					return done(null, profile);
				}
				// Someone else wants to authorize our app? Why?
				console.error('Someone else wants to authorize our app? Why?', profile.email, config.imgurEmailAddress);


				// console.log('received imgur info', accessToken, refreshToken, profile);
				return done();
			}));
		passport.use(imgurStrategy);
		refresh.use(imgurStrategy);

		const imgurRefreshFrequency = 29 * (1000 * 60 * 60 * 24); // 29 days
		const refreshImgurTokens = function () {
			const theRefreshTokenToUse = authTokens.default.imgur.imgurRefreshToken;
			console.log('attempting to refresh imgur access token using the refresh token:', theRefreshTokenToUse);
			refresh.requestNewAccessToken('imgur', theRefreshTokenToUse, (err, accessToken, refreshToken) => {
				console.log('imgur access token has been refreshed:', refreshToken);
				setImgurTokens(accessToken, refreshToken, null);
			});
		};
		setInterval(refreshImgurTokens, imgurRefreshFrequency);

		// Imgur OAuth2 Integration
		app.get('/auth/imgur', passport.authenticate('imgur'));
		app.get('/auth/imgur/callback', passport.authenticate('imgur', {
			session: false,
			failureRedirect: '/fail',
			successRedirect: '/',
		}));
		app.post('/auth/imgur/getToken', (req, res) => {
			const subdomain = getSubdomainPrefix(req)
			const response = {
				imgurAlbumHash: config.subdomains[subdomain].imgur.imgurAlbumHash,
				imgurAuthorization: config.subdomains[subdomain].imgur.imgurAuthorization
			}

			if (isValidRequestOrigin(req)) {
				response.imgurRefreshToken = authTokens[subdomain].imgur.imgurRefreshToken
				response.imgurAccessToken = authTokens[subdomain].imgur.imgurAccessToken
				response.imgurProfile = authTokens[subdomain].imgur.imgurProfile
			}

			// This will only return the imgur access token if the request is coming from the site itself
			res.json(response);
		});
	} else {
		app.get('/auth/imgur/*', (req, res) => {
			res.send("I don't have imgur data set in my configuration");
		});
		app.post('/auth/*', (req, res) => {
			res.json({});
		})
	}

	if (config.redditClientID) {
		console.log('configuring reddit API authentication for appID:', config.redditClientID);

		const setRedditTokens = function (accessToken, refreshToken, profile) {
			// FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
			// var subdomain = getSubdomainPrefix(req);

			// authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
			// authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
			// authTokens["imgur"][subdomain].imgurProfile = profile;

			for (const subdomain of subdomains) {
				console.log('setting reddit authentication information for subdomain:', subdomain);
				authTokens[subdomain].reddit.redditAccessToken = accessToken;
				authTokens[subdomain].reddit.redditRefreshToken = authTokens[subdomain].reddit.redditRefreshToken || refreshToken;
				authTokens[subdomain].reddit.redditProfile = authTokens[subdomain].reddit.redditProfile || profile;
				authTokens[subdomain].reddit.redditUserName = authTokens[subdomain].reddit.redditUserName || profile.name;
			}
		};

		const redditStrategy = new RedditStrategy({
				clientID: config.redditClientID,
				clientSecret: config.redditClientSecret,
				callbackURL: config.redditCallbackURL,
				passReqToCallback: true,
			},
			((req, accessToken, refreshToken, profile, done) => {
				if (profile.name == config.redditUserName) {
					console.log('reddit auth callback with valid profile', profile);
					setRedditTokens(accessToken, refreshToken, profile);

					return done(null, profile);
				}
				console.error('Someone else wants to authorize our app? Why?', profile.name, config.redditUserName);
				// Someone else wants to authorize our app? Why?


				process.nextTick(() => done());
			}));

		const redditRefreshFrequency = 29 * (1000 * 60 * 60 * 24); // 29 days
		const refreshRedditTokens = function () {
			const theRefreshTokenToUse = authTokens.default.reddit.redditRefreshToken;
			console.log('attempting to refresh reddit access token using the refresh token:', theRefreshTokenToUse);
			refresh.requestNewAccessToken('reddit', theRefreshTokenToUse, (err, accessToken, refreshToken) => {
				console.log('reddit access token has been refreshed:', refreshToken);
				setRedditTokens(accessToken, refreshToken, null);
			});
		};
		setInterval(refreshRedditTokens, redditRefreshFrequency);

		passport.use(redditStrategy);
		refresh.use(redditStrategy);

		// Reddit OAuth2 Integration
		app.get('/auth/reddit', (req, res, next) => {
			req.session.state = crypto.randomBytes(32).toString('hex');
			passport.authenticate('reddit', {
				state: req.session.state,
				duration: 'permanent',
			})(req, res, next);
		});
		app.get('/auth/reddit/callback', (req, res, next) => {
			// Check for origin via state token
			if (req.query.state == req.session.state) {
				passport.authenticate('reddit', {
					successRedirect: '/',
					failureRedirect: '/fail',
				})(req, res, next);
			} else {
				next(new Error(403));
			}
		});
		app.post('/auth/reddit/getToken', (req, res) => {
			const subdomain = getSubdomainPrefix(req);
			let tokensValue = 'unauthorized access';

			if (isValidRequestOrigin(req)) {
				tokensValue = {
					redditRefreshToken: authTokens[subdomain].reddit.redditRefreshToken,
					redditAccessToken: authTokens[subdomain].reddit.redditAccessToken,
					redditProfile: authTokens[subdomain].reddit.redditProfile,
				};
			}

			// This will only return the reddit access token if the request is coming from the site itself
			res.json({
				redditTokens: tokensValue,
			});
		});
	} else {
		app.get('/auth/reddit/*', (req, res) => {
			res.send("I don't have reddit data set in my configuration");
		});
		app.post('/auth/*', (req, res) => {
			res.json({});
		})
	}
}

function ImgurIngestor() {

}

function RedditIngestor() {

}

function uploadFileToS3(config, file, basePath = 'biketag', metadataMap = {}) {
	const s3 = gulpS3(config);

	console.log('watching folder for new uploads to S3:', config.bucket);
	return gulp.src(file.path, {
			allowEmpty: true,
		})
		.pipe(s3({
			Bucket: `${config.bucket}/${basePath}`,
			ACL: 'public-read',
			metadataMap,
		}, {
			maxRetries: 5,
		}));
}

function syncUploadsToS3(config) {
	const s3 = gulpS3(config);

	console.log('watching folder for new uploads to S3:', config.bucket);
	return gulpWatch(config.bucket, {
			ignoreInitial: true,
			verbose: true,
			allowEmpty: true,
		}, file => gulp.src(file.path, {
			allowEmpty: true,
		})
		.pipe(s3({
			Bucket: `${config.bucket}/biketag`,
			ACL: 'public-read',
			metadataMap: {
				'uploaded-by': config.bucket,
				title: 'title',
				description: 'description',
			},
		}, {
			maxRetries: 5,
		})));
}

function syncWithS3() {
	syncUploadsToS3(authTokens.pdx.s3);
}

function init() {
	console.log('BikeTag Webiste initialization')

	app.use(session({
		secret: 'biketag',
		resave: false,
		saveUninitialized: true,
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.json()); // to support JSON-encoded bodies
	app.use(express.urlencoded({
		extended: true,
	})) // to support URL-encoded bodies

	app.use(favicon(path.join(__dirname, 'assets/', 'favicon.ico')))
}

function run(started = () => {
	console.log(`App listening on: http://localhost:${port}`)
}) {
	if (debug) {
		app.set('port', port);

		const server = http.createServer(app)
		const reloadServer = reload(app)

		watch.watchTree(`${__dirname}/templates/`, (f, curr, prev) => {
			console.log('Asset change detected, reloading connection');
			reloadServer.reload()
		});

		server.listen(app.get('port'), started)
	} else {
		app.listen(port, started)
	}
}
/* configuration */
/*       / */
init()
/*      /  */
setVars()
/*     /   */
security()
// /*    /    */ syncWithS3();
/*   /     */
templating()
/*  /      */
authentication()
/* \/      */
run()
