![Merge upstream branches](https://github.com/biketagorg/biketag-website/workflows/Merge%20upstream%20branches/badge.svg)

# biketag-website

[![Build Status][travis-image]](https://travis-ci.org/KenEucker/biketag-website)

A website for biketag.org

![BikeTag Homepage](https://i.imgur.com/gVYRQYTm.png)

## Why?

To allow anyone and everyone to play BikeTag! This site will ingest the Reddit posts playing biketag for a configured subreddit, and display them on biketag. Conversely, using the site you can create a new tag and will be automagically posted to Reddit! This lets anyone play the game without needing to know how to imgur or having a reddit account, while continuing to support those who have been playing biketag on reddit as well!

## Features of the webapp

![BikeTag Game](https://i.imgur.com/Vq7mweWm.png)

-   See most recent round of BikeTag, and an archive of past rounds: http://pdx.biketag.org
-   A modal to play the next round (provide matching and new BikeTag images, Mystery Location description, hint, and name): http://pdx.biketag.org/#tagit
-   See all archived rounds of Biketag: http://portland.biketag.org/?count=all
-   See an individual round of BikeTag with matching images: http://pdx.biketag.org/95

# Contribute

If you'd like to contribute to this project you can [file an issue](https://github.com/keneucker/biketag-website/issues), fork the code and [create a pull request](https://github.com/keneucker/biketag-website/pulls), or [donate money towards server costs](https://paypal.me/KenEucker) which currently run between \$5-10/month.

# Development

## Install dependencies

Run `npm install` to install the node module dependencies.

## Required Configuration

The app loads a set of configuration files found in the config folder. The repository is set to ignore a config.json file, for security reasons, but there's sample of the minimum configuration to get the local site to display images for the Portland subdomain, as well as the default landing page. [sample.config.json](config.sample.json). Copy this file to config/config.json

`cp config.sample.json config/config.json`

to get started from scratch. Note: for some features to work, API values will need to be set.

## Start local server

Run `npm start` to run the webserver and then navigate to http://localhost:80 or whichever port you have set in the config.json. You can also run `npm run dev` to run in debugging mode for local development, which provides greater logging and hot-reloading.

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

The homepage landing page is in the /templates/home/ folder using the template file index.ejs. Each template should use it's own root folder for theme resources. There is a public folder in the root of the project for items that span multiple templates. Within the public folder there is a js folder that contains javascript available to all consumption. There is also a content folder within the public folder that contains raw html content which is available for editing by site administrators using git.

Note: When running in dev mode, changes to the files in the /templates/ folder are reflected immediately, with the page autoreloading.

## Dependencies

This website runs on [sexpress](https://github.com/KenEucker/sexpress), a wrapper around express, which provides a series of configurable features for a multitenant website. These features include subdomain support, api authentication using passport.js, ssl support, and more. Because these features are abstracted out of the biketag-website project, the core of this application lives inside /api/biketag/index.js to handle the BikeTag specific routes and functionality.

Sexpress uses [clobfig](https://github.com/KenEucker/clobfig), a configurator library, which clobbers all of the files found in the /config folder. Clobfig clobbers all of the js files within the config folder that have 'config.js' in their name and all .json files.

# Credits

Thank you to HorribleLogos.com for whatever it is that you provided.

[paypal-image]: https://raw.githubusercontent.com/stefan-niedermann/paypal-donate-button/master/paypal-donate-button.png
[travis-image]: https://travis-ci.org/KenEucker/biketag-website.svg?branch=master

I wonder.
