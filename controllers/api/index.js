/**
 * Module dependencies.
 */
const biketag = require('../../lib/biketag')

const routes = (app) => {
    app.routeSubdomainRequest(
        '/:tagnumber',
        (subdomain, req, res, host) => {
            if (!subdomain) {
                const hostSubdomainEnd = host.indexOf('.') + 1
                const redirectToHost = `${req.protocol}://${host.substring(hostSubdomainEnd)}`

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
        },
        'post',
    )

    app.routeSubdomainRequest(
        '/post/email',
        async (subdomain, req, res, host) => {
            try {
                const subdomainConfig = app.getSubdomainOpts(req)
                return getTagInformation(
                    subdomainConfig,
                    'latest',
                    subdomainConfig.imgur.imgurAlbumHash,
                    (latestTagInfo) => {
                        const latestTagNumber = (subdomainConfig.latestTagNumber =
                            latestTagInfo.latestTagNumber)
                        const subject = `New Bike Tag Post (#${latestTagNumber}) [${subdomain}]`
                        const body = `Hello BikeTag Admin, A new BikeTag has been posted in ${subdomainConfig.region}!\r\nTo post this tag to Reddit manually, go to ${host}/get/reddit to get the reddit post template.\r\n\r\nYou are getting this email because you are listed as an admin on the site (${host}).\r\n\r\nReply to this email to request to be removed from this admin list.`

                        subdomainConfig.adminEmailAddresses.forEach((emailAddress) => {
                            app.sendEmail(subdomainConfig, {
                                emailAddress,
                                subject,
                                body,
                                callback: (info) => {
                                    console.log(`email sent to ${emailAddress}`, info)
                                    // res.json(JSON.stringify(info))
                                },
                            })
                        })
                    },
                )
            } catch (error) {
                console.log('email api error', {
                    error,
                })
                return res.json({
                    error,
                })
            }
        },
        'post',
    )

    app.routeSubdomainRequest(
        '/post/reddit/:tagnumber?',
        async (subdomain, req, res, host) => {
            const subdomainConfig = app.getSubdomainOpts(req)
            subdomainConfig.requestSubdomain = subdomain
            subdomainConfig.host = host
            subdomainConfig.viewsFolder = app.config.viewsFolder
            subdomainConfig.version = app.config.version

            return getTagInformation(
                subdomainConfig,
                'latest',
                subdomainConfig.imgur.imgurAlbumHash,
                (latestTagInfo) => {
                    subdomainConfig.latestTagNumber = latestTagInfo.latestTagNumber

                    return postLatestBikeTagToReddit(subdomainConfig, (response) => {
                        if (!!response.error) {
                        } else {
                            console.log('posted to reddit', response)
                        }

                        return res.json({ success: response })
                    })
                },
            ).catch((e) => {
                console.log({ redditApiError: e })
                return res.json({ error: e.message })
            })
        },
        'post',
    )

    app.routeSubdomainRequest(
        '/get/reddit/:tagnumber?',
        (subdomain, req, res, host) => {
            const tagnumber = req.params.tagnumber || 'latest'
            const subdomainConfig = app.getSubdomainOpts(req)
            const albumHash = subdomainConfig.imgur.imgurAlbumHash

            console.log(`reddit endpoint request for tag #${tagnumber}`)

            return getTagInformation(subdomainConfig, tagnumber, albumHash, (data) => {
                data.host = host
                data.region = subdomainConfig.region
                return res.json(data)
            })
        },
        'post',
    )
}

module.exports = {
	index: "apidocs",
	show: "apidocs",
	routes,
}
