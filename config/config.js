module.exports = {
	ssl: {
	},
	defaults: {
		template: "biketag1",
	},
    public: {
        imgur: ['albumHash', 'queueHash'],
        reddit: ['subreddit'],
    },
    rendering: {
        overrideViewEngine: ['liquid', 'ejs'],
	},
}
