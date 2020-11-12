/**
 * Module dependencies.
 */
const biketag = require('../lib/biketag')

const routes = (app) => {
    app.routeSubdomainRequest('/:tagnumber?', (subdomain, req, res, host) => {
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
    })

    app.routeSubdomainRequest('/get/reddit/:tagnumber?', (subdomain, req, res, host) => {
        const tagnumber = req.params.tagnumber || 'latest'
        const redditTemplatePath = 'reddit/post'
        const subdomainConfig = app.getSubdomainOpts(req)
        const albumHash = subdomainConfig.imgur.imgurAlbumHash

        console.log(`reddit endpoint request for tag #${tagnumber}`, { redditTemplatePath })

        return biketag.getTagInformation(subdomainConfig, tagnumber, albumHash, (data) => {
			console.log({data})
            data.host = host
			data.region = subdomainConfig.region
            return res.render(redditTemplatePath, data)
        })
    })
}

module.exports = {
    engine: 'ejs',
    routes,
}
