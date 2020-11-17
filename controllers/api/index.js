/**
 * Module dependencies.
 */
const biketag = require('../../lib/biketag')

const _getTagNumberFromRequest = (req) => {
    return req.body.tagnumber || req.params.tagnumber || 'latest'
}

class apiController {
    init(app) {
        biketag.setLogger(app.log.debug)

        this.app = app
        // this.index = this.show = 'apidocs'
    }

    /**
     * @swagger
     * /post/reddit/:
     *   post:
     *     security:
     *       - basic: []
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
        const { imgurAlbumHash, imgurClientID } = subdomainConfig.imgur

        return getTagInformation(imgurClientID, 'latest', imgurAlbumHash, (latestTagInfo) => {
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
     *     description: Sends notification emails to BikeTag Ambassadors
     *     responses:
     *       200:
     *         description: email success response
     * @summary Sends notification emails to BikeTag Ambassadors
     * @tags email
     * @return {object} 200 - success response - application/json
     */
    sendEmailToAdministrators(subdomain, req, res, host) {
        try {
            const subdomainConfig = this.app.getSubdomainOpts(subdomain)
            const { imgurAlbumHash, imgurClientID } = subdomainConfig.imgur

            return biketag.getTagInformation(
                imgurClientID,
                'latest',
                imgurAlbumHash,
                (latestTagInfo) => {
                    const latestTagNumber = (subdomainConfig.latestTagNumber =
                        latestTagInfo.latestTagNumber)
                    const subject = this.app.sexyRenderSync('mail/newBikeTagSubject', {
                        latestTagNumber,
                        subdomain,
                    })
                    const text = this.app.sexyRenderSync('mail/newBikeTag', {
                        region: subdomainConfig.region,
                        host,
                    })
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
                            }),
                        )
                    })

                    Promise.all(emailPromises).then(() => {
                        return res.json({
                            emailResponses,
                        })
                    })
                },
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
     *   post:
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: formData
     *         name: tagnumber
     *         description: the tag nunber to retrieve
     *         schema:
     *           type: integer
     *       - in: path
     *         name: tagnumber
     *         description: the tag nunber to retrieve
     *         schema:
     *           type: integer
     *     description: Retrieves the reddit post template for the given tag number, or latest
     *     responses:
     *       200:
     *         description: reddit post text
     * @summary Retrieves the reddit post template for the given tag number, or latest
     * @tags reddit
     * @return {string} 200 - success response - application/text
     */
    getRedditPost(subdomain, req, res, host) {
        const tagnumber = _getTagNumberFromRequest(req)
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        const { imgurAlbumHash, imgurClientID } = subdomainConfig.imgur

        this.app.log.status(`reddit endpoint request for tag #${tagnumber}`)

        return biketag.getTagInformation(imgurClientID, tagnumber, imgurAlbumHash, (data) => {
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
     *         description: the tag nunber to retrieve
     *         schema:
     *           type: integer
     *       - in: path
     *         name: tagnumber
     *         description: the tag nunber to retrieve
     *         required: false
     *         schema:
     *           default: null
     *           type: integer
     *     description: Retrieves the current biketag information
     *     responses:
     *       200:
     *         description: biketag information including images
     * @summary Posts the current biketag to the configured subreddit
     * @tags biketag
     * @return {object} 200 - success response - application/json
     */
    getBikeTag(subdomain, req, res, host) {
        const tagnumber = _getTagNumberFromRequest(req)
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        const { imgurAlbumHash, imgurClientID } = subdomainConfig.imgur

        this.app.log.status(`reddit endpoint request for tag #${tagnumber}`)

        return biketag.getTagInformation(imgurClientID, tagnumber, imgurAlbumHash, (data) => {
            data.host = host
            data.region = subdomainConfig.region

            return res.json(data)
        })
    }

    routes(app) {
        const secure = true

        app.route('/post/email', this.sendEmailToAdministrators, 'post')

        app.route('/post/reddit/:tagnumber?', this.postToReddit, 'post', secure)

        app.route('/get/reddit/:tagnumber?', this.getRedditPost, 'post')

        app.route('/get/biketag/:tagnumber?', this.getBikeTag, 'post')
    }
}

module.exports = new apiController()
