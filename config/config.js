let biketagImage = (s) => s
try {
    biketagImage = require('../lib/biketag').getBiketagImageUrl
} catch (e) {
    //swallow
}

module.exports = {
    docs: {
        enabled: true,
        secureApiDocs: false,
    },
    ui: true,
    rendering: {
        overrideViewEngine: ['liquid', 'ejs'],
        liquid: {
            customFilters: {
                biketag_image: biketagImage,
				module: (src, nonce, defer) =>
					`<script src="${src}" type="module" crossorigin ${
						defer ? 'defer' : ''
					} nonce="${nonce}"></script>`,
				custom_link: (href, nonce, rel) =>
				`<link href="${href}" rel="${rel}" nonce="${nonce}"/>`,
            },
        },
    },
    ssl: {
        // enabled: false,
        contentSecurityPolicy: {
            directives: {
                fontSrc: [`'self'`, `https://fonts.googleapis.com`, `https://weloveiconfonts.com`],
                styleSrc: [`'self'`, `'unsafe-inline' https://fonts.googleapis.com`],
                connectSrc: [`'self'`, `https://api.imgur.com`],
                imgSrc: [`'self'`, `https://i.imgur.com`, `data:`],
            },
        },
    },
}
