/**
 * Module dependencies.
 */
const biketag = require('../lib/biketag')

const _getTagNumberFromRequest = (req) => {
    return req.body.tagnumber || req.params.tagnumber || 'latest'
}

class IndexController {
    init(app) {
        this.app = app
        biketag.setLogger(app.log.debug)
    }

    indexHandler(subdomain, req, res, host) {
        if (!subdomain) {
            const hostSubdomainEnd = host.indexOf('.') + 1
            const redirectToHost = `${req.protocol}://${host.substring(hostSubdomainEnd)}`

            this.app.log.status({
                subdomain,
                hostNotFound: host,
                redirectToHost,
            })

            return res.redirect(redirectToHost)
        }

        const template = this.app.getTemplateNameFromSubdomain(subdomain)
        const data = this.app.getPublicConfig(subdomain, host)

		console.log({views: this.app.get('views')})
        return this.app.renderTemplate(template, data, res)
    }

    getRedditPost(subdomain, req, res, host) {
        const tagnumber = _getTagNumberFromRequest(req)
        const redditTemplatePath = 'reddit/post'
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        const { imgurAlbumHash, imgurClientID } = subdomainConfig.imgur

        this.app.log.status(`reddit endpoint request for tag #${tagnumber}`, { redditTemplatePath })

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
    }

    routes(app) {
        app.route('/:tagnumber?', this.indexHandler)

        app.route('/get/reddit/:tagnumber?', this.getRedditPost)
    }
}

module.exports = new IndexController()
