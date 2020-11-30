const imgur = require('imgur')
const reddit = require('snoowrap')
const ejs = require('ejs')
const fs = require('fs')
const nodeCache = require('node-cache')

class BikeTagApi {
    /// TODO: add jsdocs here and tie this class to the controller in controllers/api/index using res.locals
    constructor(logger = (m) => m, cache) {
        const cacheOptions = {
            stdTTL: 600,
            checkperiod: 450,
        }
        this.cacheKeys = {
            albumHash: `imgur::`,
            bikeTagImage: `biketag::`,
            bikeTagsByUser: `usertags::`,
        }
        this.setLogger(logger)
        this.setCache(cache || new nodeCache(cacheOptions, this.cacheKeys))

        this.log(`BikeTag Cache Configured`, cache)
    }

    setCache(cache, cacheKeys) {
        this.cache = cache
        this.cacheKeys = !!cacheKeys ? cacheKeys : this.cacheKeys

        // const setCache = this.cache.set
        // this.cache.set = (key, val) => {
        // 	console.log({key, setting: val})
        // 	return setCache(key, val)
        // }
    }

    setLogger(logger) {
        this.log = logger
    }

    flushCache() {
        this.log('Flushing the cache')
        this.cache.flushAll()
    }

    getImgurAlbumInfo(imgurClientID, albumHash, callback) {
        imgur.setClientId(imgurClientID)

        return imgur.getAlbumInfo(albumHash).then((json) => {
            return callback(json.data)
        })
    }

    /// TODO: cache this response
    getImagesByUploadDate(images, newestFirst) {
        if (!newestFirst) {
            return images.sort(
                (image1, image2) => new Date(image2.datetime) - new Date(image1.datetime),
            )
        }
        return images.sort(
            (image1, image2) => new Date(image1.datetime) - new Date(image2.datetime),
        )
    }

    getBikeTagImages(imgurClientID, albumHash, callback, uncached = false) {
        const cacheKey = `${this.cacheKeys.albumHash}${imgurClientID}::${albumHash}`
        const getBikeTagImagesResponse = this.cache.get(cacheKey)

        if (!getBikeTagImagesResponse || uncached) {
            return this.getImgurAlbumInfo(imgurClientID, albumHash, (data) => {
                const images = this.getImagesByTagNumber(data.images)
                this.cache.set(cacheKey, images)

                this.log('got new getBikeTagImages', { cacheKey, image: { images } })
                return callback(images)
            }).catch((e) => console.log('ERROR: getBikeTagImages:', { e }))
        } else {
            this.log('getting cached getBikeTagImages', { cacheKey, getBikeTagImagesResponse })
            return callback(getBikeTagImagesResponse)
        }
    }

    getTagNumberFromRequest(req) {
        const pathTagNumber = parseInt(req.params.tagnumber)
        const bodyTagNumber = parseInt(req.body.tagnumber)
        // console.log({ bodyTagNumber, pathTagNumber, body: req.body })
        if (!!pathTagNumber) return pathTagNumber
        if (!!bodyTagNumber) return bodyTagNumber

        return 'latest'
    }

    getTagInformation(imgurClientID, tagNumberRequested, albumHash, callback, uncached = false) {
        const cacheKey = `${this.cacheKeys.bikeTagImage}${albumHash}::${tagNumberRequested}`
        const getTagInformationResponse = this.cache.get(cacheKey)

        if (!getTagInformationResponse || uncached) {
            return this.getBikeTagImages(
                imgurClientID,
                albumHash,
                (images) => {
                    const latestTagNumber = this.getBikeTagNumberFromImage(images[0])
                    const tagNumber =
                        tagNumberRequested == 'latest'
                            ? latestTagNumber
                            : parseInt(tagNumberRequested)

                    const proofTagNumber = tagNumber > 1 ? tagNumber - 1 : 1
                    const mysteryTagNumber = tagNumber > 1 ? tagNumber : 2
                    const previousMysteryTagNumber = proofTagNumber > 1 ? tagNumber - 1 : 1

                    const nextTagIndex = this.getTagNumberIndex(images, mysteryTagNumber)
                    const prevTagIndex = this.getTagNumberIndex(images, proofTagNumber, true)
                    const previousMysterTagIndex = this.getTagNumberIndex(
                        images,
                        previousMysteryTagNumber,
                    )

                    if (nextTagIndex == -1 || prevTagIndex == -1) {
                        return callback(null)
                    }

                    const imgurBaseUrl = 'https://imgur.com'
                    const proofTagURL = `${imgurBaseUrl}/${images[prevTagIndex].id}`
                    const nextTagURL = images[nextTagIndex].link
                    const prevTagImage = images[prevTagIndex]
                    const previousMysterTagImage =
                        previousMysterTagIndex !== -1 ? images[previousMysterTagIndex] : {}

                    const proofText = prevTagImage.description
                    const split = proofText.split('by')
                    const credit = split[split.length - 1].trim()
                    const tagData = {
                        mysteryTagNumber,
                        proofTagNumber,
                        previousMysteryTagNumber,
                        nextTagURL,
                        proofTagURL,
                        proofTagURLDirect: images[prevTagIndex].link,
                        previousMysteryTagURL: previousMysterTagImage.link,
                        credit,
                        proofText,
                        latestTagNumber,
                        image: images[nextTagIndex],
                    }

                    // if (!uncached)
                    this.cache.set(cacheKey, tagData)
                    this.log('got new getTagInformation', { cacheKey, tagData })

                    return callback(tagData)
                },
                uncached,
            )
        } else {
            this.log('getting cached getTagInformation', { cacheKey, getTagInformationResponse })
            return callback(getTagInformationResponse)
        }
    }

    postLatestBikeTagToReddit(config, callback) {
        /// Make sure we're working with the most up to date image data
        this.flushCache()

        const redditOpts = {
            userAgent: config.reddit.redditUserAgent
                .replace('VERSION', config.version)
                .replace('biketag.org', config.host),
            clientId: config.reddit.redditClientID,
            clientSecret: config.reddit.redditClientSecret,
            username: config.reddit.redditUserName,
            password: config.reddit.redditPassword,
            accessToken: `bearer ${config.reddit.redditAccessToken}`,
        }

        let r = new reddit(redditOpts)

        return this.getTagInformation(
            config.imgur.imgurClientID,
            config.latestTagNumber,
            config.imgur.albumHash,

            async (tagData) => {
                tagData.host = `${config.requestSubdomain ? `${config.requestSubdomain}.` : ''}${
                    config.requestHost || config.host
                }`
                // tagData.host = config.host
                const redditTemplatePath = `${config.viewsFolder}/reddit/post.ejs`
                const redditTemplateString = fs.readFileSync(redditTemplatePath, 'utf-8')
                const latestTagTemplate = ejs
                    .render(redditTemplateString, tagData)
                    .replace('<pre>', '')
                    .replace('</pre>', '')
                const regionName =
                    config.requestSubdomain.charAt(0).toUpperCase() +
                    config.requestSubdomain.slice(1)

                return await r
                    .getSubreddit(config.reddit.subreddit)
                    .submitSelfpost({
                        title: `Bike Tag #${config.latestTagNumber}`,
                        text: latestTagTemplate,
                    })
                    .assignFlair({
                        text: config.reddit.postFlair || 'BikeTag',
                    })
                    .approve()
                    .sticky()
                    .distinguish()
                    .submitCrosspost({
                        subredditName: 'biketag',
                        title: `[X-Post r/${config.reddit.subreddit}] Bike Tag #${config.latestTagNumber} (${config.region})`,
                        resubmit: false,
                    })
                    // .assignFlair({text: regionName})
                    .then((redditData) => {
                        if (!redditData.name) {
                            this.log('Error creating self post to reddit', redditOpts)
                            return callback()
                        }

                        // TODO: send emails of successful posting to reddit

                        redditOpts.username = config.redditUserName
                        redditOpts.password = config.redditPassword

                        r = new reddit(redditOpts)

                        /// TODO: Make this submission response handled by the u/biketagorg account for assigning
                        r.getSubmission(redditData.name)
                            .fetch()
                            .then((submission) => {
                                if (!!submission) {
                                    return r
                                        .getSubreddit(config.reddit.subreddit)
                                        .assignFlair({
                                            text: regionName,
                                        })
                                        .then(callback)
                                        .catch(callback)
                                } else {
                                    console.error('post to reddit error!')
                                }
                            })
                            .catch(callback)
                    })
                    .catch(callback)
            },
        )
    }

    getBikeTagNumberFromImage(image) {
        let tagNumber

        if (image.description) {
            const split = image.description.split(' ')
            tagNumber = Number.parseInt(split[0].substring(1))

            if (image.description.indexOf('proof') !== -1) {
                tagNumber = 0 - tagNumber
            }
        }

        return tagNumber
    }

    getBikeTagUsernameFromImage(image) {
        let username

        if (image.description) {
            const split =
                image.description.indexOf('by') !== -1
                    ? image.description.split('by')
                    : image.description.split('for')
            username = split[split.length - 1].substring(1)
            /// normalize
            username = username.replace('"', '')
        }

        return username
    }

    getImagesByTagNumber(images) {
        return images.sort((image1, image2) => {
            const tagNumber1 = this.getBikeTagNumberFromImage(image1)
            const tagNumber2 = this.getBikeTagNumberFromImage(image2)

            const tagNumber1IsProof = tagNumber1 < 0
            const difference = Math.abs(tagNumber2) - Math.abs(tagNumber1)
            const sortResult = difference !== 0 ? difference : tagNumber1IsProof ? -1 : 1

            return sortResult
        })
    }

    getTagNumberIndex(images, tagNumber, proof = false) {
        let tagNumberIndex = images.length + 1 - (tagNumber - (tagNumber % 2) + 1) * 2

        const verifyTagNumber = function (index) {
            if (!images[index] || !images[index].description) {
                return false
            }

            let compare = `#${tagNumber} tag`
            if (proof) {
                compare = `#${tagNumber} proof`
            }

            return index > -1 && !!images[index]
                ? images[index].description.indexOf(compare) !== -1
                : false
        }

        if (verifyTagNumber(tagNumberIndex)) {
            return tagNumberIndex
        }
        if (tagNumberIndex < images.length + 1 && verifyTagNumber(tagNumberIndex + 1)) {
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

    /// TODO: cache this response
    getUsernameFromTag(tagnumber = 'latest') {
        if (typeof tagnumber === 'string') {
            return this.getTagInformation(imgurClientID, tagnumber, albumHash, () => {})
        } else {
            return this.getUsernameFromTag(tagnumber)
        }
    }

    /// TODO: cache this response
    getBikeTagsByUser(imgurClientID, albumHash, username, callback, uncached = false) {
        const cacheKey = `${this.cacheKeys.bikeTagsByUser}${albumHash}::${username}`
        const getBikeTagsByUserResponse = this.cache.get(cacheKey)

        if (!getBikeTagsByUserResponse || uncached) {
            return this.getBikeTagImages(imgurClientID, albumHash, (images) => {
                if (username) {
                    const usersImages = images.filter((i) => {
                        return i.description.indexOf(username) !== -1
                    })

                    return callback(usersImages)
                } else {
                    const usernames = [],
                        imagesGroupedByUsername = {}
                    const sortedImages = images.sort((a, b) => {
                        const usernameA = this.getBikeTagUsernameFromImage(a)
                        const usernameB = this.getBikeTagUsernameFromImage(b)

                        // record the username
                        if (usernames.indexOf(usernameA) === -1) usernames.push(usernameA)

                        return ('' + usernameA).localeCompare(usernameB)
                    })
                    usernames.forEach((username) => {
                        imagesGroupedByUsername[username] = sortedImages.filter(
                            (i) =>
                                this.getBikeTagUsernameFromImage(i).localeCompare(username) === 0,
                        )
                    })

                    this.cache.set(cacheKey, imagesGroupedByUsername)

                    return callback(imagesGroupedByUsername)
                }
            })
        } else {
            this.log('getting cached getTagInformation', {
                cacheKey,
                getTagInformationResponse: getBikeTagsByUserResponse,
            })
            return callback(getBikeTagsByUserResponse)
        }
    }
}

module.exports = new BikeTagApi()
