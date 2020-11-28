module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [
        {
            name: 'BikeTag',
			// interpreter : 'node@14.15.0',
            script: 'app.js',
            env: {
                PORT: 80,
            },
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],

    /**
     * Deployment section
     * http://pm2.keymetrics.io/docs/usage/deployment/
     */
    deploy: {
        production: {
            user: 'keneucker',
            host: '212.83.163.1',
            ref: 'origin/master--built',
            repo: 'git@github.com:keneucker/biketag-website.git',
            path: '~/biketag-website',
            env: {
                NODE_ENV: 'production',
            },
        },
    },
}
