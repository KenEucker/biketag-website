/**
 * Module dependencies.
 */
const biketag = require('../../lib/biketag')
const { sleep } = require('../../lib/util')

class bikeTagController {
    /********		api documented methods		**********/
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
    postToReddit(subdomain, req, res, host) {
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        subdomainConfig.requestSubdomain = subdomain
        subdomainConfig.host = host
        subdomainConfig.viewsFolder = this.app.config.viewsFolder
        subdomainConfig.version = this.app.config.version
        const { albumHash, imgurClientID } = subdomainConfig.imgur

        return getTagInformation(imgurClientID, 'latest', albumHash, (latestTagInfo) => {
            subdomainConfig.latestTagNumber = latestTagInfo.latestTagNumber

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
                tagnumber || 'latest',
                albumHash,
                (latestTagInfo) => {
                    console.log({ latestTagInfo })
                    const latestTagNumber = (subdomainConfig.latestTagNumber =
                        latestTagInfo.latestTagNumber)
                    const subject = this.app.renderSync('mail/newBikeTagSubject', {
                        latestTagNumber,
                        subdomain,
                    })
                    const renderOpts = {
                        region: subdomainConfig.region,
                        subdomainIcon: subdomainConfig.meta.image,
                        host: `${subdomainConfig.requestSubdomain ? `${subdomainConfig.requestSubdomain}.` : ''}${subdomainConfig.requestHost || host}`,
						latestTagInfo,
                        subreddit: subdomainConfig.reddit.subreddit,
                    }

                    const text = this.app.renderSync('mail/newBikeTagText', renderOpts)
                    const html = this.app.renderSync('mail/newBikeTag', renderOpts)
					return res.json({text, html})
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

    /**
     * @swagger
     * /get/reddit/{tagnumber}:
     *   get:
     *     tags:
     *       - biketag
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: path
     *         name: tagnumber
     *         description: the tag nunber to retrieve
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: reddit post information for generated posts
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       500:
     *         $ref: '#/components/responses/UnauthorizedError'
     *   post:
     *     tags:
     *       - biketag
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: formData
     *         name: tagnumber
     *         description: the tag nunber to retrieve
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: reddit post information for generated posts
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       500:
     *         $ref: '#/components/responses/UnauthorizedError'
     * @summary Retrieves the reddit post template for the given tag number, or latest
     * @tags reddit
     * @return {string} 200 - success response - application/text
     */
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

    /********		controller methods			**********/
    init(app) {
        biketag.setLogger(app.log.debug)

        this.app = app
        // this.index = this.show = 'apidocs'
    }

    routes(app) {
        /// How to create an insecure api route from the api controller {host}/api/post/email
        app.route('/post/email/:tagnumber?', this.sendEmailToAdministrators, 'post', false)

        /// Generates the default api routes on both internal and external api servers
        app.apiRoute('/post/reddit/:tagnumber?', this.postToReddit)

        app.apiRoute('/get/reddit/:tagnumber?', this.getRedditPost)

        /// Generates the default api routes and adds an insecure get method on the root {host}/get/biketag/:number?
        app.apiRoute('/get/biketag/:tagnumber?', this.getBikeTag, ['get', 'post'])
    }
}

module.exports = new bikeTagController()
