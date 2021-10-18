const sexpress = require('sexpress')
const { createClient } = require('@supabase/supabase-js')

/// BikeTag App specific configuration filters
const onPageDataRequest = function BikeTagPublicData(publicData, appConfig, subdomain) {
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
        }, {},
    )

    return publicData
}

const appStarted = function BikeTagAppStarted() {}

const onConfigurationLoad = function BikeTagConfigurationLoad(config) {}

const onLoad = async function onLoad(config) {	
	// Create a single supabase client for interacting with your database
	const supabase = createClient('localhost:5555', config.notifications?.publicKey)

	app.hook('notifications:subscribe', async (subscription) => {
		const { data, error } = await supabase
			.from('Players')
			.insert([
				subscription,
			])
		
		return !error ? data : error
	})
	app.hook('notifications:subscribers', async () => {
		const { data, error } = await supabase
			.from('Players')
			.select()
		
			return !error ? data : error
	})
	app.hook('notifications:unsubscribe', async (subscription) => {
		const { data, error } = await supabase
			.from('Players')
			.delete()
			.match(subscription)
	})

	app.hook('biketag:newtag', (subscription) => {
		app.hook('notifications:notify', {subscription, title: 'A new tag has been played!', message: 'from something'})
	})
}

const app = sexpress({
    onPageDataRequest,
    onConfigurationLoad,
	onLoad,
})

app.run(appStarted)
