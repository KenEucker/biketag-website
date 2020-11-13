/**
 * Module dependencies.
 */
const biketag = require('../../lib/biketag')

class apiController {
    init(app) {
        biketag.setLogger(app.log.debug)

        this.app = app

        this.index = this.show = 'apidocs'
    }

    postToReddit(subdomain, req, res, host) {
        const subdomainConfig = app.getSubdomainOpts(subdomain)
        subdomainConfig.requestSubdomain = subdomain
        subdomainConfig.host = host
        subdomainConfig.viewsFolder = this.app.config.viewsFolder
        subdomainConfig.version = this.app.config.version

        return getTagInformation(
            subdomainConfig,
            'latest',
            subdomainConfig.imgur.imgurAlbumHash,
            (latestTagInfo) => {
                subdomainConfig.latestTagNumber = latestTagInfo.latestTagNumber

                return postLatestBikeTagToReddit(subdomainConfig, (response) => {
                    if (!!response.error) {
                    } else {
                        this.app.log.status('posted to reddit', response)
                    }

                    return res.json({ success: response })
                })
            },
        ).catch((e) => {
            this.app.log.error({ redditApiError: e })

            return res.json({ error: e.message })
        })
    }

    sendEmailToAdministrators(subdomain, req, res, host) {
        try {
            const subdomainConfig = this.app.getSubdomainOpts(subdomain)
            return biketag.getTagInformation(
                subdomainConfig,
                'latest',
                subdomainConfig.imgur.imgurAlbumHash,
                (latestTagInfo) => {
                    const latestTagNumber = (subdomainConfig.latestTagNumber =
                        latestTagInfo.latestTagNumber)
                    const subject = `New Bike Tag Post (#${latestTagNumber}) [${subdomain}]`
                    const text = `Hello BikeTag Admin, A new BikeTag has been posted in ${subdomainConfig.region}!\r\nTo post this tag to Reddit manually, go to ${host}/get/reddit to get the reddit post template.\r\n\r\nYou are getting this email because you are listed as an admin on the site (${host}).\r\n\r\nReply to this email to request to be removed from this admin list.`
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

    getRedditPost(subdomain, req, res, host) {
        const tagnumber = req.params.tagnumber || 'latest'
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        const albumHash = subdomainConfig.imgur.imgurAlbumHash

        this.app.log.status(`reddit endpoint request for tag #${tagnumber}`)

        return getTagInformation(subdomainConfig, tagnumber, albumHash, (data) => {
            data.host = host
            data.region = subdomainConfig.region

            return res.json(data)
        })
    }

    getBikeTag(subdomain, req, res, host) {
        const tagnumber = req.params.tagnumber || 'latest'
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        const albumHash = subdomainConfig.imgur.imgurAlbumHash

        this.app.log.status(`reddit endpoint request for tag #${tagnumber}`)

        return getTagInformation(subdomainConfig, tagnumber, albumHash, (data) => {
            data.host = host
            data.region = subdomainConfig.region

            return res.json(data)
        })
    }

    routes(app) {
        app.routeSubdomainRequest('/post/email', this.sendEmailToAdministrators, 'post')

        app.routeSubdomainRequest('/post/reddit/:tagnumber?', this.postToReddit, 'post')

        app.routeSubdomainRequest('/get/reddit/:tagnumber?', this.getRedditPost, 'post')

        app.routeSubdomainRequest('/get/biketag/:tagnumber?', this.getBikeTag, 'post')
    }
}

module.exports = new apiController()
