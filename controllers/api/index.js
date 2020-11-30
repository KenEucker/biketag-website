/**
 * Module dependencies.
 */
const biketag = require('../../lib/biketag')
const { sleep, getFromQueryOrPathOrBody } = require('../../lib/util')
const request = require('request')
class bikeTagController {
    postToReddit(subdomain, req, res, host) {
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        subdomainConfig.requestSubdomain = subdomain
        subdomainConfig.host = host
        subdomainConfig.viewsFolder = this.app.config.viewsFolder
        subdomainConfig.version = this.app.config.version
        const { albumHash, imgurClientID } = subdomainConfig.imgur

        return getTagInformation(imgurClientID, 'current', albumHash, (currentTagInfo) => {
            subdomainConfig.currentTagNumber = currentTagInfo.currentTagNumber

            return postLatestBikeTagToReddit(subdomainConfig, (response) => {
                if (!!response.error) {
                } else {
                    this.app.log.status('posted to reddit', response)
                }

                return res.json({ success: response })
            })
        }).catch((e) => {
            this.app.log.error({ redditApiError: e })

            return res.json({ error: e.message })
        })
    }

    async sendEmailToAdministrators(subdomain, req, res, host) {
        try {
            const tagnumber = biketag.getTagNumberFromRequest(req)
            const subdomainConfig = this.app.getSubdomainOpts(subdomain)
            const { albumHash, imgurClientID } = subdomainConfig.imgur

            /// Wait for the data to hit reddit
            const getTagInformationSleep = 5000
            this.app.log.status(
                `waiting for ${getTagInformationSleep}ms until getting new tag information for recent post`,
            )
            await sleep(getTagInformationSleep)

            return biketag.getTagInformation(
                imgurClientID,
                tagnumber || 'current',
                albumHash,
                (currentTagInfo) => {
                    const currentTagNumber = (subdomainConfig.currentTagNumber =
                        currentTagInfo.currentTagNumber)
                    const subject = this.app.renderSync('mail/newBikeTagSubject', {
                        currentTagNumber,
                        subdomain,
                    })
                    const renderOpts = {
                        region: subdomainConfig.region,
                        subdomainIcon: subdomainConfig.meta.image,
                        host: `${
                            subdomainConfig.requestSubdomain
                                ? `${subdomainConfig.requestSubdomain}.`
                                : ''
                        }${subdomainConfig.requestHost || host}`,
                        currentTagInfo,
                        subreddit: subdomainConfig.reddit.subreddit,
                    }

                    const text = this.app.renderSync('mail/newBikeTagText', renderOpts)
                    const html = this.app.renderSync('mail/newBikeTag', renderOpts)

                    const emailPromises = []
                    const emailResponses = []

                    subdomainConfig.adminEmailAddresses.forEach((emailAddress) => {
                        emailPromises.push(
                            this.app.sendEmail(subdomainConfig, {
                                to: emailAddress,
                                subject,
                                text,
                                callback: (info) => {
                                    this.app.log.status(`email sent to ${emailAddress}`, info)
                                    emailResponses.push(info.response)
                                },
                                html,
                            }),
                        )
                    })

                    Promise.all(emailPromises).then(() => {
                        return res.json({
                            emailResponses,
                        })
                    })
                },
                true,
            )
        } catch (error) {
            this.app.log.error('email api error', {
                error,
            })
            return res.json({
                error,
            })
        }
    }

    getRedditPost(subdomain, req, res, host) {
        const tagnumber = biketag.getTagNumberFromRequest(req)
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        const { albumHash, imgurClientID } = subdomainConfig.imgur

        this.app.log.status(`reddit endpoint request for tag #${tagnumber}`)

        return biketag.getTagInformation(imgurClientID, tagnumber, albumHash, (data) => {
            data = data || {
                error: {
                    message: 'tagnumber: Not Found',
                    tagnumber,
                },
            }
            data.host = host
            data.region = subdomainConfig.region

            return res.json(data)
        })
    }

    getBikeTag(subdomain, req, res, host) {
        const tagnumber = biketag.getTagNumberFromRequest(req)
        /// TODO: put this into sexpress
        const subdomainIsApi = subdomain === 'api'
        const requestSubdomain = subdomainIsApi
            ? req.path.match(/^\/[^\/]+/)[0].substr(1)
            : subdomain

        const subdomainConfig = this.app.getSubdomainOpts(requestSubdomain)
        const { albumHash, imgurClientID } = subdomainConfig.imgur

        this.app.log.status(`reddit endpoint request for tag #${tagnumber}`)

        return biketag.getTagInformation(imgurClientID, tagnumber, albumHash, (data) => {
            data.host = host
            data.region = subdomainConfig.region

            return res.json(data)
        })
    }

    getBikeTagImage(subdomain, req, res, host, getProof = false) {
        const tagnumber = biketag.getTagNumberFromRequest(req)
        /// TODO: put this into sexpress
        const subdomainIsApi = subdomain === 'api'
        const requestSubdomain = subdomainIsApi
            ? req.path.match(/^\/[^\/]+/)[0].substr(1)
            : subdomain

        const subdomainConfig = this.app.getSubdomainOpts(requestSubdomain)
        const { albumHash, imgurClientID } = subdomainConfig.imgur

        return biketag.getTagInformation(imgurClientID, tagnumber, albumHash, (data) => {
            const imageUrl = getProof ? data.proofTagURLDirect : data.previousMysteryTagURL
            this.app.log.status(`sending the reponse from imgur direct ${imageUrl}`, imageUrl)
            return req.pipe(request(imageUrl)).pipe(res)
        })
    }

    getBikeTagsByUser(subdomain, req, res, host, next, username) {
        /// TODO: put this into sexpress
        const subdomainIsApi = subdomain === 'api'
        const requestSubdomain = subdomainIsApi
            ? req.path.match(/^\/[^\/]+/)[0].substr(1)
            : subdomain
        const subdomainConfig = this.app.getSubdomainOpts(requestSubdomain)
        const { albumHash, imgurClientID } = subdomainConfig.imgur

        return biketag.getBikeTagsByUser(imgurClientID, albumHash, username, (images) => {
            return res.json({ username, images })
        })
    }

    /********		controller methods			**********/
    init(app) {
        biketag.setLogger(app.log.debug)

        this.app = app
        // this.index = this.show = 'apidocs'
    }

    routes(app) {
        /********	api documented endpoints	**********/
        /**
         * @swagger
         * /post/email:
         *   post:
         *     tags:
         *       - biketag
         *     description: Sends notification emails to BikeTag Ambassadors
         *     responses:
         *       200:
         *         description: email success response
         * @summary Sends notification emails to BikeTag Ambassadors
         * @tags email
         * @return {object} 200 - success response - application/json
         */
        app.route('/post/email/:tagnumber?', this.sendEmailToAdministrators, 'post', false)
        /// How to create an insecure api route from the api controller {host}/api/post/email

        /**
         * @swagger
         * /post/reddit/:
         *   post:
         *     security:
         *       - basic: []
         *     tags:
         *       - biketag
         *     description: Posts the current biketag to the configured subreddit
         *     responses:
         *       200:
         *         description: reddit post information for generated posts
         *       401:
         *         $ref: '#/components/responses/UnauthorizedError'
         * @summary Posts the current biketag to the configured subreddit
         * @tags reddit
         * @return {object} 200 - success response - application/json
         */
        app.apiRoute('/post/reddit/:tagnumber?', this.postToReddit)

        /**
         * @swagger
         * /get/biketag/{tagnumber}:
         *   post:
         *     produces:
         *       - application/json
         *     parameters:
         *       - in: formData
         *         name: tagnumber
         *         description: the tag number to retrieve
         *         schema:
         *           type: integer
         *       - in: path
         *         name: tagnumber
         *         description: the tag number to retrieve
         *         required: false
         *         schema:
         *           type: integer
         *     description: Retrieves the current biketag information
         *     tags:
         *       - biketag
         *     responses:
         *       200:
         *         description: biketag information including images
         * @summary Posts the current biketag to the configured subreddit
         * @tags biketag
         * @return {object} 200 - success response - application/json
         */
        app.apiRoute('/get/biketag/:tagnumber?', this.getBikeTag, ['get', 'post'])

        /**
         * @swagger
         * /get/biketag/{tagnumber}:
         *   post:
         *     produces:
         *       - application/json
         *     parameters:
         *       - in: formData
         *         name: tagnumber
         *         description: the tag number to retrieve
         *         schema:
         *           type: integer
         *       - in: path
         *         name: tagnumber
         *         description: the tag number to retrieve
         *         required: false
         *         schema:
         *           type: integer
         *     description: Retrieves the current biketag information
         *     tags:
         *       - biketag
         *     responses:
         *       200:
         *         description: biketag information including images
         * @summary Posts the current biketag to the configured subreddit
         * @tags biketag
         * @return {object} 200 - success response - application/json
         */
        app.apiRoute('/get/current', this.getBikeTag, ['get', 'post'])

        /**
         * @swagger
         * /get/users
         *   post:
         *     produces:
         *       - application/json
         *     description: Retrieves all users for a given BikeTag game
         *     tags:
         *       - biketag
         *     responses:
         *       200:
         *         description: usernames and images
         * @summary Retrieves all users for a given BikeTag game
         * @tags biketag
         * @return {object} 200 - success response - application/json
         */
        app.apiRoute('/get/users', this.getBikeTagsByUser, ['get', 'post'])

        /**
         * @swagger
         * /t/{tagnumber}:
         *   post:
         *     produces:
         *       - application/json
         *     parameters:
         *       - in: formData
         *         name: tagnumber
         *         description: the tag number image to retrieve
         *         schema:
         *           type: integer
         *       - in: path
         *         name: tagnumber
         *         description: the tag number image to retrieve
         *         required: false
         *         schema:
         *           type: integer
         *     description: Retrieves the biketag image
         *     tags:
         *       - biketag
         *     responses:
         *       200:
         *         description: biketag  image
         * @summary Returns the mystery tag image from imgur for the given tagnumber directly from imgur
         * @tags biketag
         * @return {object} 200 - success response - application/json
         */
        app.apiRoute(
            '/t/:tagnumber?',
            (s, r, q, h) => {
                return this.getBikeTagImage(s, r, q, h)
            },
            ['get', 'post'],
        )

        /**
         * @swagger
         * /p/{tagnumber}:
         *   post:
         *     produces:
         *       - application/json
         *     parameters:
         *       - in: formData
         *         name: tagnumber
         *         description: the proof tag number image to retrieve
         *         schema:
         *           type: integer
         *       - in: path
         *         name: tagnumber
         *         description: the proof tag number image to retrieve
         *         required: false
         *         schema:
         *           type: integer
         *     description: Retrieves proof the biketag image
         *     tags:
         *       - biketag
         *     responses:
         *       200:
         *         description: biketag  image
         * @summary Returns the proof image from imgur for the given tagnumber directly from imgur
         * @tags biketag
         * @return {object} 200 - success response - application/json
         */
        app.apiRoute(
            '/p/:tagnumber?',
            (s, r, q, h, n) => {
                return this.getBikeTagImage(s, r, q, h, n, true)
            },
            ['get', 'post'],
        )

        /**
         * @swagger
         * /u/{username}:
         *   post:
         *     produces:
         *       - application/json
         *     parameters:
         *       - in: formData
         *         name: username
         *         description: the tag number to retrieve
         *         schema:
         *           type: integer
         *       - in: path
         *         name: username
         *         description: the tag number to retrieve
         *         required: false
         *         schema:
         *           type: integer
         *     description: Retrieves the current biketag information
         *     tags:
         *       - biketag
         *     responses:
         *       200:
         *         description: biketag information including images
         * @summary Posts the current biketag to the configured subreddit
         * @tags biketag
         * @return {object} 200 - success response - application/json
         */
        app.apiRoute(
            '/u/:username?',
            (s, r, q, h, n) => {
                const username = getFromQueryOrPathOrBody(r, 'username')
                return this.getBikeTagsByUser(s, r, q, h, n, username)
            },
            ['get', 'post'],
        )
    }
}

module.exports = new bikeTagController()
