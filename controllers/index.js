/**
 * Module dependencies.
 */
const biketag = require('../lib/biketag')

const init = (app) => {
    biketag.setLogger(app.log.debug)
}

const routes = (app) => {
    app.routeSubdomainRequest('/:tagnumber?', (subdomain, req, res, host) => {
        if (!subdomain) {
            const hostSubdomainEnd = host.indexOf('.') + 1
            const redirectToHost = `${req.protocol}://${host.substring(hostSubdomainEnd)}`

            app.log.status({
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

    app.routeSubdomainRequest('/get/reddit/:tagnumber?', function getRedditPost(
        subdomain,
        req,
        res,
        host,
    ) {
        const tagnumber = req.params.tagnumber || 'latest'
        const redditTemplatePath = 'reddit/post'
        const subdomainConfig = app.getSubdomainOpts(subdomain)
        const { imgurAlbumHash, imgurClientID } = subdomainConfig.imgur

        app.log.status(`reddit endpoint request for tag #${tagnumber}`, { redditTemplatePath })

        return biketag.getTagInformation(imgurClientID, tagnumber, imgurAlbumHash, (data) => {
            if (!data) {
                return res.json({
                    tagNumberNotFound: tagnumber,
                    imgurAlbumHash,
                })
            }

            data.host = host
            data.region = subdomainConfig.region
            return res.render(redditTemplatePath, data)
        })
    })
}

module.exports = {
    init,
    engine: 'ejs',
    routes,
}
