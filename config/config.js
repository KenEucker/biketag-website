let biketagImage = (s) => s
try {
    biketagImage = require('../lib/biketag').getBiketagImageUrl
} catch (e) {
    //swallow
}

module.exports = {
	ui: true,
    middlewares: { email: true },
    rendering: {
        liquid: {
            customFilters: {
                biketag_image: biketagImage,
            },
        },
    },
    ssl: {
		enabled: true,
        contentSecurityPolicy: {
            directives: {
                fontSrc: [`'self'`, `https://fonts.googleapis.com`, `https://weloveiconfonts.com`],
                styleSrc: [
                    `'self'`,
                    `'unsafe-inline' https://fonts.googleapis.com`,
                    `'unsafe-inline' uglipop.min.js`,
                ],
                scriptSrc: [`'unsafe-inline' https://www.googletagmanager.com`],
                connectSrc: [
                    `'self'`,
                    `https://api.imgur.com`,
                    `https://www.google-analytics.com`,
                    `https://mdbootstrap.com`,
                ],
                imgSrc: [
                    `'self'`,
                    `https://i.imgur.com`,
                    `https://www.googletagmanager.com`,
                    `https://www.google-analytics.com`,
                    `https://mdbootstrap.com`,
                    `data:`,
                ],
            },
        },
    },
}
