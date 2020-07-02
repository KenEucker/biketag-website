const merge = require('deepmerge')
const sexpress = require('sexpress')

/// BikeTag App specific configuration filters
const publicConfigFilter = (publicConfig, appConfig, subdomain) => {
	const subdomains = Object.keys(appConfig.subdomains)

	publicConfig.subdomains = Object.values(appConfig.subdomains).reduce((out, subdomainInformation, index) => {
		const subdomainName = subdomains[index]
		const subdomainConfig = publicConfig.subdomains[subdomainName]
		publicConfig.supportedRegions = appConfig.supportedRegions

		// console.log({subdomainConfig})
		const pageData = merge(subdomainConfig, {
			location: subdomainInformation.location,
			easter: subdomainInformation.easter,
			tagline: subdomainInformation.tagline,
			jingle: subdomainInformation.jingle,
			region: subdomainInformation.region,
			readonly: subdomainInformation.readonly,
			newGameImage: subdomainInformation.newGameImage,
			reddit: {
				subreddit: subdomainInformation.reddit.redditSubreddit,
			}
		})

		out[subdomainName] = pageData

		if (subdomain === subdomainName) {
			publicConfig.page = pageData
		}

		return out

	}, {})

	return publicConfig
}

const app = sexpress({
	publicConfigFilter,
})

app.run()
