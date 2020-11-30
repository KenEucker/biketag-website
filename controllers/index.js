/**
 * Module dependencies.
 */
const biketag = require('../lib/biketag')
const { getParamFromPathOrBody } = require('../lib/util')
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
        const pageData = this.app.getPublicData(subdomain, host, undefined, res)
        const subdomainConfig = this.app.getSubdomainOpts(subdomain)
        const { albumHash, imgurClientID } = subdomainConfig.imgur

        if (subdomain === 'index') {
            return this.app.renderTemplate(template, pageData, res)
        }

        return biketag.getTagInformation(imgurClientID, 'latest', albumHash, (data) => {
            const bikeTagPageData = { ...pageData, latestBikeTag: data || {} }

            return this.app.renderTemplate(template, bikeTagPageData, res)
        })
    }

    getUserTags(subdomain, req, res, host) {
        const username = getParamFromPathOrBody(req, 'username')
        /// TODO: put this into sexpress
        const subdomainIsApi = subdomain === 'api'
        const requestSubdomain = subdomainIsApi
            ? req.path.match(/^\/[^\/]+/)[0].substr(1)
            : subdomain

        const subdomainConfig = this.app.getSubdomainOpts(requestSubdomain)
        const { albumHash, imgurClientID } = subdomainConfig.imgur

        return biketag.getBikeTagsByUser(imgurClientID, albumHash, username, (images) => {
            let template = 'users/user'
            const pageData = this.app.getPublicData(requestSubdomain, host, undefined, res)
			const bikeTagUserPageData = { ...pageData, images, username }

			if (!username) {
				template = 'users'
				bikeTagUserPageData.usernames = Object.keys(images)
			}

            return this.app.renderTemplate(template, bikeTagUserPageData, res)
        })
    }

    getLeaderboard(subdomain, req, res, host) {
		
        /// TODO: put this into sexpress
        const subdomainIsApi = subdomain === 'api'
        const requestSubdomain = subdomainIsApi
            ? req.path.match(/^\/[^\/]+/)[0].substr(1)
            : subdomain

        const subdomainConfig = this.app.getSubdomainOpts(requestSubdomain)
        const { albumHash, imgurClientID } = subdomainConfig.imgur

        return biketag.getBikeTagsByUser(imgurClientID, albumHash, undefined, (images) => {
            const template = 'users/leaderboard'
            const pageData = this.app.getPublicData(requestSubdomain, host, undefined, res)
            const bikeTagUserPageData = { ...pageData, images, usernames: Object.keys(images) }

            return this.app.renderTemplate(template, bikeTagUserPageData, res)
        })
    }

    getLatest(subdomain, req, res, host) {
		const tagnumber = 'latest'
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

    routes(app) {
		app.route('/user', this.getUserTags)
		app.route('/user/:username', this.getUserTags)
		
		app.route('/leaderboard', this.getLeaderboard)
		
		app.route('/latest', this.getLatest)
		
        app.route('/:tagnumber?', this.indexHandler)
    }
}

module.exports = new IndexController()
