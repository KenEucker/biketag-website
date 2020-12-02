const { extname } = require('path')

const biketagImage = (url, size = '') => {
    const ext = extname(url)
    /// Make sure the image type is supported
    if (['.jpg', '.jpeg', '.png', '.bmp'].indexOf(ext) === -1) return url

    switch (size) {
        default:
        case 'original':
        case '':
            break

        case 'small':
            size = 's'
        case 's':
            break

        case 'medium':
            size = 's'
        case 'm':
            break

        case 'large':
            size = 'l'
        case 'l':
            break
    }

    return url.replace(ext, `${size}${ext}`)
}

module.exports = {
    middlewares: { email: true },
    rendering: {
        liquid: {
            customFilters: {
                biketag_image: biketagImage,
            },
        },
    },
    ssl: {
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
