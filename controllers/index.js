/**
 * Module dependencies.
 */
const biketag = require('../lib/biketag')

class IndexController {
    init(app) {
        this.app = app
        biketag.setLogger(app.log.debug)

        Object.keys(this.app.config.subdomains).forEach((subdomain) => {
            const subdomainInformation = this.app.config.subdomains[subdomain]

            /// Set the description of the API for this subdomain to the tagline.
            subdomainInformation.meta = subdomainInformation.meta ? subdomainInformation.meta : {}
            subdomainInformation.meta.description = subdomainInformation.tagline

            /// Copy over the email information, if it's not set by the subdomain
            subdomainInformation.email =
                subdomainInformation.email || this.app.config.authentication.email

            this.app.config.subdomains[subdomain] = subdomainInformation
        })
    }

    indexHandler(subdomain, req, res, host) {
        const template = this.app.getTemplateNameFromSubdomain(subdomain)
        const pageData = this.app.getPublicData(subdomain, host)
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        const { imgurAlbumHash, imgurClientID } = subdomainConfig.imgur

        if (subdomain === 'index') {
            return this.app.renderTemplate(template, pageData, res)
        }

        return biketag.getTagInformation(imgurClientID, 'latest', imgurAlbumHash, (data) => {
            const bikeTagPageData = { ...pageData, latestBikeTag: data || {} }

            return this.app.renderTemplate(template, bikeTagPageData, res)
        })
    }

    getRedditPost(subdomain, req, res, host) {
        const tagnumber = biketag.getTagNumberFromRequest(req)
        const redditTemplatePath = 'reddit/post'
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)

        if (!subdomainConfig.imgur) {
            this.app.log.status(`imgur not set for host on subdomain [${subdomain}]`, host)
            return res.send('no image data set')
        }

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
