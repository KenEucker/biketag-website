const express = require('express')
const session = require('express-session')
const path = require('path')
const fs = require('fs')
const bodyParser = require('body-parser')
const merge = require('deepmerge')

const app = express()
const {
	setInterval,
} = require('safe-timers')
const favicon = require('serve-favicon')
const crypto = require('crypto')
const passport = require('passport')
const {
	Strategy: ImgurStrategy,
} = require('passport-imgur')
const {
	Strategy: RedditStrategy,
} = require('passport-reddit')

const refresh = require('passport-oauth2-refresh')
const imgur = require('imgur')
const Reddit = require('reddit')
const gulp = require('gulp')
const watch = require('watch')
const gulpWatch = require('gulp-watch')
const gulpS3 = require('gulp-s3-upload')
const http = require('http')
const reload = require('reload')

const { version } = require('./package.json')
let config = require('./config.json')

let reddit

const subdomains = Object.keys(config.subdomains)

const authTokens = {};

// Never let debug mode run in production
let debug = process.argv.length > 2 ? process.argv[2].indexOf('--debug') > -1 : config.debug || false;
debug = process.env.NODE_ENV !== 'production' ? debug : false;

if (debug) {
	config = merge(config, require('./config.debug'), { version })
}

const port = debug ? 8080 : config.port || 80;

function setVars() {
	const getValueFromConfig = function (name, tokens) {
		// Assign the subdomain based value or use the default from the base cofig
		return tokens[name] || config[name];
	}

	for (const subdomain of subdomains) {
		config.subdomains[subdomain] = merge(config.defaults, config.subdomains[subdomain])
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


	/// Populate the data files into the object to be sent with the public configuration
	const dataFolder = path.join(__dirname, 'data', 'config')
	const dataFiles = fs.readdirSync(dataFolder)
	const data = {}

	dataFiles.forEach((dataFile) => {
		const dataFileSplit = dataFile.split('.')
		const dataFileName = dataFileSplit[0]
		const dataFileExtension = dataFileSplit[1]

		if (dataFileExtension === 'json') {
			const fileData = require(path.join(dataFolder, dataFile))
			config[dataFileName] = merge(config[dataFileName], fileData)
		}
	})

	/// Populate the content files into the object to be sent with the public configuration
	const contentFolder = path.join(__dirname, 'data', 'content')
	const contentFiles = fs.readdirSync(contentFolder)
	const content = {}
	
	contentFiles.forEach((contentFile) => {
		const contentFileSplit = contentFile.split('.')
		const contentFileName = contentFileSplit[0]
		const contentFileExtension = contentFileSplit[1]

		if (contentFileExtension === 'html') {
			const html = fs.readFileSync(path.join(contentFolder, contentFile), { encoding:'utf8' })
			content[contentFileName] = html
		}
	})

	config.content = content

	// merge(config, data)
	// Object.assign(config, data, {})
	// console.log(config)
}

/// TODO: refactor this request to only use the data from the data folder, with whatever else is required, instead of chunking out the data from the config
function getPublicConfigurationValues(subdomain, host) {
	const publicConfig = {
		host,
		SUBDOMAIN: subdomain.toUpperCase(),
		thisSubdomain: subdomain,
		supportedRegions: config.supportedRegions,
		debug: config.debug,
		content: config.content,
	}

	publicConfig.subdomains = Object.values(config.subdomains).reduce((out, subdomainInformation, index) => {
		const subdomainName = subdomains[index]
		const customCssPath = path.join(__dirname, 'assets/css', `${subdomain}.css`)
		const hasCustomCss = fs.existsSync(customCssPath)

		const pageData = merge( config.page, {
			location: subdomainInformation.location,
			images: subdomainInformation.images,
			adminEmailAddresses: subdomainInformation.adminEmailAddresses,
			easter: subdomainInformation.easter,
			tagline: subdomainInformation.tagline,
			region: subdomainInformation.region,
			metaUrl: subdomainInformation.metaUrl || config.metaUrl,
			metaType: subdomainInformation.metaType || config.metaType,
			metaTitle: subdomainInformation.metaTitle || config.metaTitle,
			metaDescription: subdomainInformation.metaDescription || config.metaDescription,
			gaUA: subdomainInformation.gaUA || config.gaUA,
			readonly: subdomainInformation.readonly,
			newGameImage: subdomainInformation.newGameImage,
			hasCustomCss,
		})
		
		out[subdomainName] = pageData

		if (subdomain === subdomainName) {
			publicConfig.page = pageData
		}

		return out

	}, {})

	publicConfig.content = config.content


	return publicConfig
}

function getSubdomainPrefix(req, returnAlias = false) {
	const defaultSubdomain = req.subdomains.length ? req.subdomains[0] : 'default'
	const localhostSubdomainEnd = !!req.headers.host ? req.headers.host.indexOf('.') : -1
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
	const origin = req.get('origin') || 'none'
	const subdomain = getSubdomainPrefix(req, true)
	const subdomainPrefix = `${subdomain == 'default' ? '' : `${subdomain}.`}`
	const path = ''
	const reconstructedUrl = `${req.protocol}://${subdomainPrefix}localhost${path}`
	const localhostPortIsTheSameForDebugging = (origin === reconstructedUrl || origin === `${reconstructedUrl}:${port}`)
	const originIsCorrectSubdomain = origin == `http://${subdomainPrefix}biketag.org`
	const originIsValid = originIsCorrectSubdomain || localhostPortIsTheSameForDebugging

	if (originIsValid) {
		console.log(`origin ${origin} is valid`)
	} else {
		console.error(`origin ${origin} is not valid`, {
			localhostPortIsTheSameForDebugging,
			originIsCorrectSubdomain,
			reconstructedUrl,
			originIsValid,
			subdomain,
			origin,
		})
	}

	return originIsValid
}

function getBikeTagNumberFromImage(image) {
	let tagNumber

	if (image.description) {
		var split = image.description.split(' ')
		tagNumber = Number.parseInt(split[0].substring(1))

		if(image.description.indexOf('proof') !== -1) {
			tagNumber = 0 - tagNumber
		}
	}

	return tagNumber
}

function getImagesByTagNumber(images) {
	return images.sort(function (image1, image2) {
		var tagNumber1 = getBikeTagNumberFromImage(image1)
		var tagNumber2 = getBikeTagNumberFromImage(image2)

		var tagNumber1IsProof = tagNumber1 < 0
		var difference = Math.abs(tagNumber2) - Math.abs(tagNumber1)
		var sortResult = difference !== 0 ? difference : (tagNumber1IsProof ? -1 : 1)

		return sortResult
	})
}

function getImagesByUploadDate(images, newestFirst) {
	if (!newestFirst) {
		return images.sort((image1, image2) => new Date(image2.datetime) - new Date(image1.datetime));
	}
	return images.sort((image1, image2) => new Date(image1.datetime) - new Date(image2.datetime));
}

function getTagNumberIndex(images, tagNumber, proof = false) {
	let tagNumberIndex = ((images.length + 1) - (((tagNumber - (tagNumber % 2) + 1) * 2)));
	
	const verifyTagNumber = function (index) {
		let compare = `#${tagNumber} tag`
		if (proof) {
			compare = `#${tagNumber} proof`
		}
		
		return index > -1 && !!images[index] ? images[index].description.indexOf(compare) !== -1 : false
	}

	if (verifyTagNumber(tagNumberIndex)) {
		return tagNumberIndex
	}
	if (tagNumberIndex < (images.length + 1) && verifyTagNumber(tagNumberIndex + 1)) {
		return tagNumberIndex + 1
	}
	if (tagNumberIndex > 0 && verifyTagNumber(tagNumberIndex - 1)) {
		return tagNumberIndex - 1
	}

	for (let i = 0; i < images.length; ++i) {
		if (verifyTagNumber(i)) {
			return i
		}
	}

	return -1
}

function renderTemplate(template, data, res) {
	const pageTemplate = path.join(config.templatePath, template, 'index')

	if (config.supportRendering && fs.existsSync(`${pageTemplate}.ejs`)) {

		// console.log('rendering template', pageTemplate)
		return res.render(pageTemplate, data)
	}

	const pageFile = `${pageTemplate}.html`
	if (fs.existsSync(pageFile)) {
		
		console.log('serving html file', pageFile)
		return res.sendFile(pageFile)
		/// TODO: Send data somehow?
	}

	console.log('could not render template', template)
}

function getTagInformation(subdomain, tagNumber, albumHash, callback) {

	imgur.setClientId(authTokens[subdomain].imgur.imgurClientID)

	const getTagRequest = imgur.getAlbumInfo(albumHash).then((json) => {
		const images = getImagesByTagNumber(json.data.images)
		const latestTagNumber = getBikeTagNumberFromImage(images[0])
		tagNumber = tagNumber == 'latest' ? latestTagNumber : tagNumber
		// console.log('hello', { tagNumber, images: { images: [0] }, latestTagNumber })
		
		const prevTagNumber = tagNumber > 1 ? tagNumber - 1 : 1
		const nextTagNumber = tagNumber > 1 ? tagNumber : 2
		const nextTagIndex = getTagNumberIndex(images, nextTagNumber)
		const prevTagIndex = getTagNumberIndex(images, prevTagNumber, true)

		// console.log({prevTagNumber,
		// 	nextTagNumber,
		// 	nextTagIndex,
		// 	prevTagIndex})

		const proofTagURL = `https://imgur.com/${images[prevTagIndex].id}`
		const nextTagURL = images[nextTagIndex].link
		const prevTagImage = images[prevTagIndex]

		const split = prevTagImage.description.split('by')
		const credit = split[split.length - 1].trim()
		const proofText = prevTagImage.description

		const tagData = {
			latestTagNumber,
			prevTagNumber,
			nextTagNumber,
			nextTagIndex,
			prevTagIndex,
			proofTagURL,
			nextTagURL,
			credit,
			proofText,
		}

		return callback(tagData)
	})

	if (!debug) {
		getTagRequest.catch((err) => {
			console.error({ getTagError: err.message })
			res.send(err.message)
		})
	}

	return getTagRequest
}

function filterSubdomainRequest(endpoint, response) {
	app.get(endpoint, (req, res, next) => {
		const subdomain = getSubdomainPrefix(req)
		const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

		console.log('request from ip:', ip)

		return response(subdomain, req, res, next)
	})
}

function templating(templatePath = path.join(__dirname, '/templates/'), supportRendering = true) {
	config.templatePath = templatePath
	config.supportRendering = supportRendering

	if (config.supportRendering) {
		//Set view engine to ejs
		app.set("view engine", "ejs")

		//Tell Express where we keep our index.ejs
		// app.set("views", path.join(__dirname, "templates"))

		//Use body-parser
		app.use(bodyParser.urlencoded({
			extended: false
		}))
	}

	filterSubdomainRequest('/:tagnumber?', (subdomain, req, res) => {
		const host = req.headers.host

		if (!subdomain) {
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
		const data =  getPublicConfigurationValues(subdomain, host)

		return renderTemplate(template, data, res)
	})

	Object.keys(config.subdomains).forEach((subdomain) => {
		if (!!config.subdomains[subdomain]) {
			const subdomainTemplate = config.subdomains[subdomain].template
			
			if (!!subdomainTemplate) {
				console.log({templatePath, subdomainTemplate})
				const subdomainTemplatePath = path.join(templatePath, subdomainTemplate)

				if (fs.existsSync(subdomainTemplatePath)) {
					console.log(`configuring static path for subdomain: ${subdomain}`, subdomainTemplatePath)

					app.use(express.static(subdomainTemplatePath))
				} else {
					console.log('subdomain template not found', {subdomain, subdomainTemplatePath})
				}
			} else {
				console.log('subdomain template not set', { subdomain })
			}
		} else {
			console.log('cannot configure subdomain', subdomain)
		}
	})

	const baseOverride = path.join(templatePath, 'base')
	console.log(`configuring static path for the base override files`, baseOverride)
	app.use(express.static(baseOverride))

	app.use('/assets', (req, res) => {
		if (config.debug) console.log('asset requested', req.url);
		const file = req.url = (req.url.indexOf('?') != -1) ? req.url.substring(0, req.url.indexOf('?')) : req.url;
		res.sendFile(path.join(__dirname, 'assets/', req.url));
	});

	console.log('finished templating set up for path', templatePath);
}

function security() {
	app.all('/*', (req, res, next) => {
		const url = req.url

		if (config.debug) console.log('security check', url)

		// CORS headers
		res.header('Access-Control-Allow-Origin', '*'); // restrict it to the required domain
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
		// Set custom headers for CORS
		res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
		if (req.method == 'OPTIONS') {
			console.error('failed security check!', url);
			res.status(200).end();
		} else {
			next();
		}
	});

	console.log('request security enabled')
}

function endpoints() {
	filterSubdomainRequest('/get/reddit/:tagnumber?', (subdomain, req, res) => {
		const tagnumber = req.params.tagnumber || 'latest'
		const albumHash = config.subdomains[subdomain].imgur.imgurAlbumHash
		const host = req.headers.host
		const redditTemplatePath = path.join(config.templatePath, 'reddit', 'post')

		console.log(`reddit endpoint request for tag #${tagnumber}`)

		console.log({ tagnumber })
		return getTagInformation(subdomain, tagnumber, albumHash, (data) => {
			data.host = host
			return res.render(redditTemplatePath, data)
		})
	})
}

function authentication() {
	passport.serializeUser((user, done) => {
		done(null, user)
	})

	passport.deserializeUser((obj, done) => {
		done(null, obj)
	})

	/// TODO: map tokens to each subdomain
	if (config.defaults.imgurClientID) {
		console.log('configuring imgur API authentication for appID:', config.defaults.imgurClientID)

		const setImgurTokens = function (accessToken, refreshToken, profile) {
			// FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
			// var subdomain = getSubdomainPrefix(req);

			// authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
			// authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
			// authTokens["imgur"][subdomain].imgurProfile = profile;

			for (const subdomain of subdomains) {
				authTokens[subdomain].imgur.imgurAccessToken = accessToken;
				authTokens[subdomain].imgur.imgurRefreshToken = authTokens[subdomain].imgur.imgurRefreshToken || refreshToken;
				authTokens[subdomain].imgur.imgurProfile = authTokens[subdomain].imgur.imgurProfile || profile;
				console.log(`imgur authentication information for subdomain: subdomain`, authTokens[subdomain].imgur);
			}
		}

		console.log({
			clientID: config.defaults.imgurClientID,
			clientSecret: config.defaults.imgurClientSecret,
			callbackURL: config.defaults.imgurCallbackURL,
		})

		/// TODO: map tokens to each subdomain
		const imgurStrategy = new ImgurStrategy({
				clientID: config.defaults.imgurClientID,
				clientSecret: config.defaults.imgurClientSecret,
				callbackURL: config.defaults.imgurCallbackURL,
				passReqToCallback: true,
			},
			((req, accessToken, refreshToken, profile, done) => {
				if (profile.email == config.defaults.imgurEmailAddress) {
					console.log('imgur auth callback with valid profile', profile)
					setImgurTokens(accessToken, refreshToken, profile)
					return done(null, profile)
				}

				// Someone else wants to authorize our app? Why?
				console.error('Someone else wants to authorize our app? Why?', { req, email: profile.email, imgurEmail: config.imgurEmailAddress })


				// console.log('received imgur info', accessToken, refreshToken, profile);
				return done()
			}))
		passport.use(imgurStrategy)
		refresh.use(imgurStrategy)

		const imgurRefreshFrequency = 29 * (1000 * 60 * 60 * 24) // 29 days
		const refreshImgurTokens = function () {
			const theRefreshTokenToUse = authTokens.default.imgur.imgurRefreshToken
			console.log('attempting to refresh imgur access token using the refresh token:', theRefreshTokenToUse)

			refresh.requestNewAccessToken('imgur', theRefreshTokenToUse, (err, accessToken, refreshToken) => {
				console.log('imgur access token has been refreshed:', refreshToken)
				setImgurTokens(accessToken, refreshToken, null)
			})
		}
		setInterval(refreshImgurTokens, imgurRefreshFrequency)

		// Imgur OAuth2 Integration
		app.get('/auth/imgur', passport.authenticate('imgur'))

		app.get('/auth/imgur/callback', passport.authenticate('imgur', {
			session: false,
			failureRedirect: '/fail',
			successRedirect: '/',
		}))

		app.post('/auth/imgur/getToken', (req, res) => {
			const subdomain = getSubdomainPrefix(req)
			const response = {
				imgurAlbumHash: config.subdomains[subdomain].imgur.imgurAlbumHash,
				imgurAuthorization: config.subdomains[subdomain].imgur.imgurAuthorization,
			}
			console.log({getTokenResponse: response})

			if (isValidRequestOrigin(req)) {
				response.imgurRefreshToken = authTokens[subdomain].imgur.imgurRefreshToken
				response.imgurAccessToken = authTokens[subdomain].imgur.imgurAccessToken
				response.imgurProfile = authTokens[subdomain].imgur.imgurProfile
			}

			// This will only return the imgur access token if the request is coming from the site itself
			res.json(response)
		})
	} else {
		app.get('/auth/imgur/*', (req, res) => {
			res.send("I don't have imgur data set in my configuration")
		});
		app.post('/auth/*', (req, res) => {
			res.json({})
		})
	}

	/// TODO: map tokens to each subdomain
	if (config.defaults.redditClientID) {
		console.log('configuring reddit API authentication for appID:', config.defaults.redditClientID)

		const setRedditTokens = function (accessToken, refreshToken, profile) {
			// FOR DOMAIN SPECIFIC USER ACCOUNTS ( DO NOT DELETE )
			// var subdomain = getSubdomainPrefix(req);

			// authTokens["imgur"][subdomain].imgurRefreshToken = refreshToken;
			// authTokens["imgur"][subdomain].imgurAccessToken = accessToken;
			// authTokens["imgur"][subdomain].imgurProfile = profile;

			for (const subdomain of subdomains) {
				console.log('setting reddit authentication information for subdomain:', subdomain)

				authTokens[subdomain].reddit.redditAccessToken = accessToken
				authTokens[subdomain].reddit.redditRefreshToken = authTokens[subdomain].reddit.redditRefreshToken || refreshToken
				authTokens[subdomain].reddit.redditProfile = authTokens[subdomain].reddit.redditProfile || profile
				authTokens[subdomain].reddit.redditUserName = authTokens[subdomain].reddit.redditUserName || profile.name
			}
		};

		/// TODO: map tokens to each subdomain
		const redditStrategy = new RedditStrategy({
				clientID: config.defaults.redditClientID,
				clientSecret: config.defaults.redditClientSecret,
				callbackURL: config.defaults.redditCallbackURL,
				passReqToCallback: true,
			},
			((req, accessToken, refreshToken, profile, done) => {
				/// TODO: map tokens to each subdomain
				if (profile.name == config.defaults.redditUserName) {
					console.log('reddit auth callback with valid profile', { profile, accessToken, refreshToken })
					setRedditTokens(accessToken, refreshToken, profile)

					return done(null, profile)
				}

				console.error('Someone else wants to authorize our app? Why?', { profileName: profile.name, redditUserName: config.defaults.redditUserName })


				process.nextTick(() => done())
			}))

		const redditRefreshFrequency = 29 * (1000 * 60 * 60 * 24) // 29 days
		const refreshRedditTokens = function () {
			const theRefreshTokenToUse = authTokens.default.reddit.redditRefreshToken;
			console.log('attempting to refresh reddit access token using the refresh token:', theRefreshTokenToUse);
			refresh.requestNewAccessToken('reddit', theRefreshTokenToUse, (err, accessToken, refreshToken) => {
				console.log('reddit access token has been refreshed:', refreshToken)
				setRedditTokens(accessToken, refreshToken, null)
			})
		}
		setInterval(refreshRedditTokens, redditRefreshFrequency)

		passport.use(redditStrategy)
		refresh.use(redditStrategy)

		// Reddit OAuth2 Integration
		app.get('/auth/reddit', (req, res, next) => {
			req.session.state = crypto.randomBytes(32).toString('hex');
			console.log('authenticating')
			passport.authenticate('reddit', {
				state: req.session.state,
				duration: 'permanent',
			})(req, res, next)
		})

		app.get('/auth/reddit/callback', (req, res, next) => {
			// Check for origin via state token
			if (req.query.state == req.session.state) {
				console.log("passporting reddit", {req})

				passport.authenticate('reddit', {
					successRedirect: '/',
					failureRedirect: '/fail',
				})(req, res, next)
				
			} else {
				console.log("Error 403", { incomingState: req.query.state, sessionState: req.session.state })
				next(new Error(403))
			}
		})

		app.post('/auth/reddit/getToken', (req, res) => {
			const subdomain = getSubdomainPrefix(req)
			let tokensValue = 'unauthorized access'
			// console.log("getting token")

			if (isValidRequestOrigin(req)) {
				// console.log("request is valid")
				tokensValue = {
					redditRefreshToken: authTokens[subdomain].reddit.redditRefreshToken,
					redditAccessToken: authTokens[subdomain].reddit.redditAccessToken,
					redditProfile: authTokens[subdomain].reddit.redditProfile,
				}
			}

			// This will only return the reddit access token if the request is coming from the site itself
			res.json({
				redditTokens: tokensValue,
			})
		})
	} else {
		app.get('/auth/reddit/*', (req, res) => {
			const responseMessage = "I don't have reddit data set in my configuration"
			// console.log(responseMessage)
			res.send(responseMessage)
		});
		app.post('/auth/*', (req, res) => {
			res.json({})
		})
	}
}

function getSubdomainOpts(req) {

	const subdomain = getSubdomainPrefix(req, true)
	
	return {
		requestSubdomain: subdomain,
		...config.subdomains[subdomain]
	}

}

function ImgurConnector() {

}

function ingestNewRedditPostForBikeTag() {

}

function createNewBikeTagPostOnReddit(config, callback) {
	const opts = {
		username: config.redditUserName,
		password: config.redditPassword,
		appId: config.redditClientID,
		appSecret: config.redditClientSecret,
		userAgent: config.redditUserAgent.replace('VERSION', version),
		accessToken: `bearer ${authTokens[config.requestSubdomain].reddit.redditAccessToken}`
	}
	console.log('reddit opts', opts)
	reddit = new Reddit(opts)

	return reddit.post('/api/submit', {
		// sr: config.redditSubreddit,
		sr: 'biketag',
		kind: 'link',
		// resubmit: true,
		title: `[X-Post r/${config.redditSubreddit}] TEST`,
		url: 'https://www.reddit.com/r/CyclePDX/comments/h7q3kk/bike_tag_228/'
	  },
	  opts.accessToken
	  ).then(callback)
}

function RedditConnector(config) {
	app.post('/post/reddit', async (req, res) => {
		try {
			return createNewBikeTagPostOnReddit(getSubdomainOpts(req), (response) => {
				res.json(JSON.stringify(response))
			})
		} catch (error) {
			console.log('reddit post api error', { error })
			res.json( { error } )
		}
	})
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

function AWSS3Connector(config) {
	config = !!config ? config : authTokens.pdx.s3
	const s3 = gulpS3(config)

	console.log('watching folder for new uploads to S3:', config.bucket)
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
		})))
}

function init() {
	console.log('BikeTag MultiTenant WebApp InitSeq')

	app.use(session({
		secret: '~biketag~',
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
/*   /     */
endpoints()
// /*    /    */ AWSS3Connector()
/*    /    */
RedditConnector(config)
// /*    /    */ ImgurConnector()
/*   /     */
templating()
/*  /      */
authentication()
/* \/      */
run()
