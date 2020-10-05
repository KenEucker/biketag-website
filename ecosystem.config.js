module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [
        {
            name: 'BikeTag',
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
        dev: {
            user: 'node',
            host: '212.83.163.1',
            ref: 'origin/develop',
            repo: 'git@github.com:keneucker/biketag-website.git',
            path: '~/biketag-website-dev',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env dev',
            env: {
                NODE_ENV: 'dev',
            },
        },
    },
};
