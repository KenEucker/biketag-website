module.exports = {
	subdomains: {
		"default": {
			"imgur": {
				imgurAlbumHash: 'Y9PKtpI'
			},
			"reddit": {
				redditSubreddit: 'CyclePDX'
			}
		},
		"pdx": {
			"imgur": {
				imgurAlbumHash: 'Y9PKtpI'
			},
			"reddit": {
				redditSubreddit: 'CyclePDX'
			},
		},
	},
	imgurClientID: "",
	imgurClientSecret: "",
	imgurCallbackURL: "",
	imgurEmailAddress: '',

	redditClientID: "",
	redditClientSecret: "",
	redditCallbackURL: "",
	redditUserName: '',

	s3CdnUrl: '',
	s3EmailAddress: '',
	s3AccessKeyId: '',
	s3SecretAccessKey: '',
	s3Region: '',

	port: 8080,
	bucket: 'biketagorg',
	debug: true
};
