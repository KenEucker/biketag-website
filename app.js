const sexpress = require('sexpress')
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid');
const { default: async } = require('async');

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

const appStarted = function BikeTagAppStarted() {
	app.hook('notifications:admin-subscribers', async (subscribersHook) => {
		app.sendNotificationToAllSubscribers('BikeTag Server', `Server restarted on ${Date.now().toLocaleString()}`, 'admin')
		// const subscribers = await subscribersHook[0]()

		// subscribers.map((s) => {
		// 	app.notifications.sendNotificationToSubscription(s.subscription, 'BikeTag Server', `Server restarted on ${Date.now().toLocaleString()}`)
		// })
	}, false)
}

const onConfigurationLoad = function BikeTagConfigurationLoad(config) {}

const onLoad = async function onLoad(config) {	
	// Create a single supabase client for interacting with your database
	const supabase = createClient(config.authentication?.supabase?.endpoint, config.authentication?.supabase?.publicKey)

	app.hook('notifications:subscribe', async (subscription) => {
		const {domain, endpoint} = subscription
		const email = subscription?.email ?? `subscription:${endpoint}`

		let { player, playerError } = await supabase
			.from('PlayerDevices')
			.select()
			.eq('email', email)

		if (!player) {
			player = { 
				id: uuidv4(),
				email,
			}
			const { insertData, insertError } = await supabase
				.from('Players')
				.insert([
					player,
				])

			if (insertError) {
				app.log.info(`error adding player: ${insertError.message}`, insertError)
			} else {
				app.log.info(`added new player ${player.id}`, insertData)
			}
		}
		
		if (subscription.host) delete subscription.host
		if (subscription.domain) delete subscription.domain

		app.log.info(`adding player's device ${endpoint}`)

		const playerDevice = {
			subscription,
			uri: endpoint,
			user: player.id ?? null,
			domain: domain,
		}
		const { data, error } = await supabase
			.from('PlayerDevices')
			.upsert([
				playerDevice,
			], {onConflict: 'uri'})
		return !error ? data : error
	})
	app.hook('notifications:subscribers', async () => {
		const { data, error } = await supabase
			.from('PlayerDevices')
			.select()
		
			return !error ? data : error
	})
	app.hook('notifications:admin-subscribers', async () => {
		const { data, error } = await supabase
			.from('PlayerDevices')
			.select()
			.eq('domain', 'admin')
		
			return !error ? data : error
	})
	app.hook('notifications:unsubscribe', async (subscription) => {
		const { data, error } = await supabase
			.from('PlayerDevices')
			.delete()
			.match({uri: subscription.endpoint})
			
			return !error ? data : error
	})

	app.hook('biketag:newtag', (newTag) => {
		app.hook('notifications:notify', {domain: newTag.subdomain, title: 'A new tag has been played!', message: 'from something'})
	})
}

const app = sexpress({
    onPageDataRequest,
    onConfigurationLoad,
	onLoad,
})

app.run(appStarted.bind({app}))
