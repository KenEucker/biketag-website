const imgur = require('imgur')
const reddit = require('snoowrap')
const ejs = require('ejs')
const fs = require('fs')
const nodeCache = require('node-cache')


const _getImgurAlbumInfo = (imgurClientID, albumHash, callback) => {
    imgur.setClientId(imgurClientID)

    return imgur.getAlbumInfo(albumHash).then((json) => {
        return callback(json.data)
    })
}

const _getBikeTagNumberFromImage = (image) => {
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

const _getImagesByTagNumber = (images) => {
    return images.sort(function (image1, image2) {
        var tagNumber1 = _getBikeTagNumberFromImage(image1)
        var tagNumber2 = _getBikeTagNumberFromImage(image2)

        var tagNumber1IsProof = tagNumber1 < 0
        var difference = Math.abs(tagNumber2) - Math.abs(tagNumber1)
        var sortResult = difference !== 0 ? difference : tagNumber1IsProof ? -1 : 1

        return sortResult
    })
}

const _getImagesByUploadDate = (images, newestFirst) => {
    if (!newestFirst) {
        return images.sort(
            (image1, image2) => new Date(image2.datetime) - new Date(image1.datetime),
        )
    }
    return images.sort((image1, image2) => new Date(image1.datetime) - new Date(image2.datetime))
}

const _getTagNumberIndex = (images, tagNumber, proof = false) => {
    let tagNumberIndex = images.length + 1 - (tagNumber - (tagNumber % 2) + 1) * 2

    const verifyTagNumber = function (index) {
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

class BikeTagApi {
    constructor(logger = (m) => m) {
        const cacheOptions = {
            stdTTL: 600,
            checkperiod: 450,
        }

        this.setLogger(logger)
        this.setCache(new nodeCache(cacheOptions), {
            imgurAlbumHash: `imgur::`,
            bikeTagImage: `biketag::`,
        })

        this.log(`BikeTag Cache Configured`, cacheOptions)
    }

    setCache(cache, cacheKeys) {
        this.cache = cache
        this.cacheKeys = !cacheKeys ? this.cacheKeys : cacheKeys
    }

    setLogger(logger) {
        this.log = logger
    }

    flushCache() {
        this.cache.flushAll()
    }

    getBikeTagImages(imgurClientID, imgurAlbumHash, callback) {
        const cacheKey = `${this.cacheKeys.imgurAlbumHash}${imgurClientID}::${imgurAlbumHash}`
        const getBikeTagImagesResponse = this.cache.get(cacheKey)

        if (!getBikeTagImagesResponse) {
            this.log('getting new getBikeTagImages', { imgurClientID, imgurAlbumHash })
            return _getImgurAlbumInfo(imgurClientID, imgurAlbumHash, (data) => {
                const images = this.getImagesByTagNumber(data.images)
                this.cache.set(cacheKey, images)

                return callback(images)
            })
        } else {
            this.log('getting cached getBikeTagImages', getBikeTagImagesResponse)
            return callback(getBikeTagImagesResponse)
        }
    }

    getTagInformation(imgurClientID, tagNumber, albumHash, callback) {
        const cacheKey = `${this.cacheKeys.bikeTagImage}${albumHash}::${tagNumber}`
        const getTagInformationResponse = this.cache.get(cacheKey)

        if (!getTagInformationResponse) {
            this.log('getting new getTagInformation', { imgurClientID, tagNumber, albumHash })
            return this.getBikeTagImages(imgurClientID, albumHash, (images) => {
                const latestTagNumber = this.getBikeTagNumberFromImage(images[0])
                tagNumber = tagNumber == 'latest' ? latestTagNumber : tagNumber

                const prevTagNumber = tagNumber > 1 ? tagNumber - 1 : 1
                const nextTagNumber = tagNumber > 1 ? tagNumber : 2
                const nextTagIndex = this.getTagNumberIndex(images, nextTagNumber)
                const prevTagIndex = this.getTagNumberIndex(images, prevTagNumber, true)

                if (nextTagIndex == -1 || prevTagIndex == -1) {
                    console.log('LOL', { latestTagNumber })
                    return callback(null)
                }

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

                this.cache.set(cacheKey, tagData)
                return callback(tagData)
            })
        } else {
            this.log('getting cached getTagInformation', getTagInformationResponse)
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
            config.latestTagNumber,
            config.imgur.imgurAlbumHash,
            async (tagData) => {
                tagData.host = config.host
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
                    .getSubreddit(config.reddit.redditSubreddit)
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
                        title: `[X-Post r/${config.reddit.redditSubreddit}] Bike Tag #${config.latestTagNumber} (${config.region})`,
                        resubmit: false,
                    })
                    // .assignFlair({text: regionName})
                    .then((redditData) => {
                        if (!redditData.name) {
                            this.log('Error creating self post to reddit', redditOpts)
                            return callback()
                        }

                        // TODO: send emails of successful posting to reddit

                        redditOpts.username = config.defaults.redditUserName
                        redditOpts.password = config.defaults.redditPassword

                        r = new reddit(redditOpts)

                        /// TODO: Make this submission response handled by the u/biketagorg account for assigning
                        r.getSubmission(redditData.name)
                            .fetch()
                            .then((submission) => {
                                if (!!submission) {
                                    return r
                                        .getSubreddit(config.defaults.redditSubreddit)
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
        return _getBikeTagNumberFromImage(image)
    }

    getImagesByTagNumber(images) {
        return _getImagesByTagNumber(images)
    }

    getTagNumberIndex(images, tagNumber, proof = false) {
        return _getTagNumberIndex(images, tagNumber, proof)
    }
}

module.exports = new BikeTagApi()
