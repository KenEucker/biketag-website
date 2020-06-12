# biketag-website
[![Build Status][travis-image]](https://travis-ci.org/KenEucker/biketag-website)

A website for biketag.org

## Why?
To allow anyone and everyone to play biketag! This site will ingest the Reddit posts playing biketag for a configured subreddit, and display them on biketag. Conversely, using the site you can create a new tag and will be automagically posted to Reddit! This lets anyone play the game without needing to know how to imgur or having a reddit account, while continuing to support those who have been playing biketag on reddit as well!

## Features of the webapp
* See current tag, previous proof tag, and original previous tag: http://pdx.biketag.org
* Tag new location (provide next tag image, proof tag image, name, and other information like location): http://pdx.biketag.org/#tagit
* See all historic tags: http://portland.biketag.org/?count=all
* See individual tags with original tag and found it tag: http://pdx.biketag.org/95
* Only region that is currently up and running is http://pdx.biketag.org, which the homepage mirrors. Other regions are supported, though not set up.

# Contribute
If you'd like to contribute to this project you can [file an issue](https://github.com/keneucker/biketag-website/issues), fork the code and [create a pull request](https://github.com/keneucker/biketag-website/pulls), or [donate money towards server costs](https://paypal.me/KenEucker) which currently run between $5-10/month.

[![Donate with PayPal][paypal-image]](https://paypal.me/KenEucker)

# Development
## Install dependencies
Run `npm install` to install the node module dependencies. 

## Required Configuration
The app loads a config.json file found in the root folder. There's sample of the minimum configuration to get the local site to display images for the Portland subdomain, as well as the default landing page. [sample.config.json](config.sample.json)

## Start local server
Run `npm run run` to run the webserver and then navigate to http://localhost:80 or whichever port you have set in the config.json. You can also run `npm run dev` to run in debugging mode for local development, which provides greater logging and hot-reloading.

## Change the website code
This project supports Embedded Javascript templating, [ejs](https://ejs.co/), for the templates served by each subdomain. A template may have either an `index.html` or `index.ejs` file in it's root that the express application will serve for a given subdomain. Using data from the config.json file as well as the data found in /data/config/, in conjunction with the raw html in the /data/content/ folder, data can be injected into the ejs templates.

To use within javascript:
```
<script>
	// get the supportedRegions object via JSON serialization
	var subs = JSON.parse(`<%- JSON.stringify(supportedRegions) %>`)
</script>
```

To use within html:
```
<audio id="biketag-jingle">
	<!-- insert the page.easter.jingle variable into the src attribute of this audio element -->
	<source src="<%= page.easter.jingle %>" type="audio/mpeg">
</audio>
```

The homepage landing page is in the /templates/home/ folder using the template file index.ejs. Each template should use it's own root folder for theme resources. There is an assets folder in the root of the project for items that span multiple templates. Within the assets folder there is a js folder that contains javascript available to all consumption. There is also a content folder within the assets folder that contains raw html content which is available for editing by site administrators using git.

Note: When running in dev mode, changes to the files in the /templates/ folder are reflected immediately, with the page autoreloading.

# Credits

Thank you to HorribleLogos.com for whatever it is that you provided.

[paypal-image]:https://raw.githubusercontent.com/stefan-niedermann/paypal-donate-button/master/paypal-donate-button.png
[travis-image]:https://travis-ci.org/KenEucker/biketag-website.svg?branch=master
