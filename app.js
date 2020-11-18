const merge = require('deepmerge')
const sexpress = require('sexpress')

/// BikeTag App specific configuration filters
const publicConfigFilter = (publicConfig, appConfig, subdomain) => {
    const subdomains = Object.keys(appConfig.subdomains)

    publicConfig.supportedRegions = appConfig.supportedRegions
    publicConfig.subdomains = Object.values(appConfig.subdomains).reduce(
        (out, subdomainInformation, index) => {
            const subdomainName = subdomains[index]
            const subdomainConfig = publicConfig.subdomains[subdomainName]
            out[subdomainName] = subdomainConfig

            const subdomainPublicConfig = merge(subdomainConfig, {
                location: subdomainInformation.location,
                easter: subdomainInformation.easter,
                tagline: subdomainInformation.tagline,
                region: subdomainInformation.region,
                readonly: subdomainInformation.readonly,
                newGameImage: subdomainInformation.newGameImage,
            })

            out[subdomainName] = subdomainPublicConfig

            if (subdomain === subdomainName) {
                publicConfig.page = subdomainPublicConfig
            }

            return out
        },
        {},
    )

    return publicConfig
}

const app = sexpress({
    publicConfigFilter,
})

app.run()
