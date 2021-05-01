const sexpress = require('sexpress')

/// BikeTag App specific configuration filters
const publicFilter = function BikeTagPublicData(publicData, appConfig, subdomain) {
    const subdomains = Object.keys(appConfig.subdomains)

    publicData.supportedRegions = appConfig.supportedRegions
    publicData.subdomains = Object.values(appConfig.subdomains).reduce(
        (out, subdomainInformation, index) => {
            const subdomainName = subdomains[index]
            const subdomainConfig = publicData.subdomains[subdomainName] || {}

            if (subdomainInformation.imgur) {
                subdomainConfig.imgur = subdomainConfig.imgur || {}
                subdomainConfig.imgur.imgurClientID = subdomainInformation.imgur.imgurClientID
                subdomainConfig.imgur.albumHash = subdomainInformation.imgur.albumHash
                subdomainConfig.imgur.imgurAuthorization =
                    subdomainInformation.imgur.imgurAuthorization
            }
            out[subdomainName] = subdomainConfig

            out[subdomainName] = subdomainInformation

            if (subdomain === subdomainName) {
                publicData.page = subdomainInformation
            }

            return out
        },
        {},
    )
	
    return publicData
}

const app = sexpress({
    publicFilter,
})

app.run()
