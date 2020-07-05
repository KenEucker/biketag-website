/**
 * Module dependencies.
 */
const imgur = require('imgur')
const Reddit = require('reddit')
const ejs = require('ejs')
const fs = require('fs')

exports.engine = 'ejs';

const getTagInformation = (config, subdomain, tagNumber, albumHash, callback) => {
	// console.trace({config})
	imgur.setClientId(config.imgur.imgurClientID)

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

	// if (!config.debug) {
	// 	getTagRequest.catch((err) => {
	// 		console.error({
	// 			getTagError: err.message
	// 		})
	// 		res.send(err.message)
	// 	})
	// }

	return getTagRequest
}

const postLatestBikeTagToReddit = (config, callback) => {
	const redditOpts = {
		username: config.reddit.redditUserName,
		password: config.reddit.redditPassword,
		appId: config.reddit.redditClientID,
		appSecret: config.reddit.redditClientSecret,
		userAgent: config.reddit.redditUserAgent.replace('VERSION', config.version),
		accessToken: `bearer ${config.reddit.redditAccessToken}`
	}

	console.log({redditOpts, redditConfig: config.reddit, config})

	reddit = new Reddit(redditOpts)

	return getTagInformation(config, config.requestSubdomain, config.latestTagNumber, config.imgur.imgurAlbumHash, (tagData) => {
		tagData.host = config.host
		const redditTemplatePath = `${config.viewsFolder}/reddit/post.ejs`
		const redditTemplateString = fs.readFileSync(redditTemplatePath, 'utf-8')
		const latestTagTemplate = ejs.render(redditTemplateString, tagData).replace('<pre>', '').replace('</pre>', '')
		// console.log({tagData, latestTagTemplate})

		return reddit.post('/api/submit', {
			sr: config.reddit.redditSubreddit,
			kind: 'self',
			resubmit: true,
			title: `Bike Tag #${config.latestTagNumber}`,
			text: latestTagTemplate,
		}).then((redditData) => {
			console.log({redditData})

			// return reddit.post('/api/submit', {
			// 	sr: 'biketag',
			// 	kind: 'link',
			// 	resubmit: true,
			// 	title: `[X-Post r/${config.reddit.redditSubreddit}] Bike Tag #${config.latestTagNumber} (${config.region})`,
			// 	url: `https://www.reddit.com/r/${config.reddit.redditSubreddit}/`,
			// }).then(callback)
			callback()

		})
	})
}

function getBikeTagNumberFromImage(image) {
	let tagNumber

	if (image.description) {
		var split = image.description.split(' ')
		tagNumber = Number.parseInt(split[0].substring(1))

		if (image.description.indexOf('proof') !== -1) {
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

// exports.before = function(req, res, next){
//   var id = req.params.user_id;
//   if (!id) return next();
//   // pretend to query a database...
//   process.nextTick(function(){
//     req.user = db.users[id];
//     // cant find that user
//     if (!req.user) return next('route');
//     // found it, move on to the routes
//     next();
//   });
// };

// exports.list = function(req, res, next){
//   res.render('list', { users: db.users });
// };

// exports.edit = function(req, res, next){
//   res.render('edit', { user: req.user });
// };

const show = (req, res, next) => {
	res.render('templates/', {
		user: req.user
	})
}

const update = (req, res, next) => {
	var body = req.body
	req.user.name = body.user.name
	//   res.message('Information updated!')
	res.redirect('/latest')
}

const routes = (app) => {
	const appConfig = app.config

	app.filterSubdomainRequest("/latest", (subdomain, req, res, host) => {
  
		if (!subdomain) {
		  const hostSubdomainEnd = host.indexOf(".") + 1
		  const redirectToHost = `${req.protocol}://${host.substring(
			hostSubdomainEnd
		  )}`
  
		  console.log({
			subdomain,
			hostNotFound: host,
			redirectToHost,
		  })
  
		  return res.redirect(redirectToHost)
		}
  
		const template = app.getTemplateNameFromSubdomain(subdomain)
		const data = app.getPublicConfigurationValues(subdomain, host)
  
		return app.renderTemplate(template, data, res)
	  })

	app.filterSubdomainRequest("/:tagnumber?", (subdomain, req, res, host) => {
  
		if (!subdomain) {
		  const hostSubdomainEnd = host.indexOf(".") + 1
		  const redirectToHost = `${req.protocol}://${host.substring(
			hostSubdomainEnd
		  )}`
  
		  console.log({
			subdomain,
			hostNotFound: host,
			redirectToHost,
		  })
  
		  return res.redirect(redirectToHost)
		}
  
		const template = app.getTemplateNameFromSubdomain(subdomain)
		const data = app.getPublicConfigurationValues(subdomain, host)
  
		return app.renderTemplate(template, data, res)
	  })

	app.filterSubdomainRequest('/post/email', async (subdomain, req, res, host) => {
		try {
			const subdomainConfig = app.getSubdomainOpts(req)
			return getTagInformation(appConfig, subdomain, 'latest', subdomainConfig.imgur.imgurAlbumHash, (latestTagInfo) => {
				const latestTagNumber = subdomainConfig.latestTagNumber = latestTagInfo.latestTagNumber
				const subject = `New Bike Tag Post (#${latestTagNumber}) [${subdomain}]`
				const body = `Hello BikeTag Admin, A new BikeTag has been posted in ${subdomainConfig.region}!\r\nTo post this tag to Reddit manually, go to ${host}/get/reddit to get the reddit post template.\r\n\r\nYou are getting this email because you are listed as an admin on the site (${host}).\r\n\r\nReply to this email to request to be removed from this admin list.`

				subdomainConfig.adminEmailAddresses.forEach((emailAddress) => {
					app.sendEmail(subdomainConfig, emailAddress, subject, body, (info) => {
						console.log(`email sent to ${emailAddress}`, info)
						// res.json(JSON.stringify(info))
					})
				})
			})
		} catch (error) {
			console.log('email api error', {
				error
			})
			res.json({
				error
			})
		}
	}, 'post')

	app.filterSubdomainRequest('/post/reddit', async (subdomain, req, res, host) => {
		const subdomainConfig = app.getSubdomainOpts(req)
		subdomainConfig.requestSubdomain = subdomain
		subdomainConfig.host = host
		subdomainConfig.viewsFolder = appConfig.viewsFolder

		return getTagInformation(subdomainConfig, subdomain, 'latest', subdomainConfig.imgur.imgurAlbumHash, (latestTagInfo) => {
			subdomainConfig.latestTagNumber = latestTagInfo.latestTagNumber

			// subdomainConfig.reddit.redditPassword = appConfig.defaults.redditPassword
			// subdomainConfig.reddit.redditUserName = appConfig.defaults.redditUserName

			return postLatestBikeTagToReddit(subdomainConfig, (response) => {
				console.log('posted to reddit', response)
				res.json({ success: response })
			})
		}).catch(e => {
			console.log({ redditApiError: e })
			res.json({ error: e.message })
		})
	}, 'post')

	app.filterSubdomainRequest(
		"/get/reddit/:tagnumber?",
		(subdomain, req, res, host) => {
			const tagnumber = req.params.tagnumber || "latest"
			const redditTemplatePath = "reddit/post"
			const subdomainConfig = app.getSubdomainOpts(req)
			const albumHash = subdomainConfig.imgur.imgurAlbumHash

			console.log(`reddit endpoint request for tag #${tagnumber}`, { redditTemplatePath })

			return getTagInformation(subdomainConfig, subdomain, tagnumber, albumHash, (data) => {
				data.host = host
				return res.render(redditTemplatePath, data)
			})
		}
	)
}

module.exports = {
	routes,
	show,
	update,
}
