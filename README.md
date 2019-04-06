# biketag-website
[![Build Status][travis-image]](travis-url)

A website for biketag.org

## Why?
To allow anyone and everyone to play biketag! This site will ingest the Reddit posts playing biketag for a configured subreddit, and display them on biketag. Conversely, using the site you can create a new tag and will be automagically posted to Reddit! This lets anyone play the game without needing to know how to imgur or having a reddit account, while continuing to support those who have been playing biketag on reddit as well!

## Features
* See current tag, previous proof tag, and original previous tag: http://biketag.org
* Tag new location (provide next tag image, proof tag image, name, and other information like location): http://biketag.org/#tagit
* See all historic tags: http://biketag.org/?count=all
* See individual tags with original tag and found it tag: http://biketag.org/?tagnumber=95
* Only region that is currently up and running is http://pdx.biketag.org, which the homepage mirrors. Other regions are supported, though not set up.

# Contribute
If you'd like to contribute to this project you can [file an issue](https://github.com/keneucker/biketag-website/issues), fork the code and [create a pull request](https://github.com/keneucker/biketag-website/pulls), or [donate money towards server costs](https://paypal.me/KenEucker) which currently run between $5-10/month.

[![Donate with PayPal](https://raw.githubusercontent.com/stefan-niedermann/paypal-donate-button/master/paypal-donate-button.png)](https://paypal.me/KenEucker)

[travis-url]: https://travis-ci.org/KenEucker/biketag-website
[travis-image]: https://travis-ci.org/KenEucker/biketag-website.svg?branch=master

# Development
## Install dependencies
Run `npm install` to install the node module dependencies. 

## Required Configuration
The app loads a config.json file found in the root folder. Here's an example of a minimum config to get the local site to display images for the Portland subdomain as the default:
```
{
  "subdomains": {
    "default": {
      "imgur": {
        "imgurAlbumHash": "Y9PKtpI"
      },
      "reddit": {
        "redditSubreddit": "CyclePDX"
        }
      }
    },
  "port": 3000
}

```

## Start local server
Run `npm run run` to run the webserver and then navigate to http://localhost:3000 or whichever port you have set in the config.json. You can also run `npm run dev` to run in debugging mode for local development, though it is not required.

## Change the website code
The homepage is in the /templates/pages/ folder using index.html. The styles are in the /templates/sass/ folder using main.scss. The sass is compiled by running the command `npm run sass` and all of the output files are saved in the folder /assets/css/. The rest of the website content is in the /assets/ folder, including javascript and fonts and images. 

Note: When running in dev mode, changes to the files in the /assets/ folder are reflected immediately upon the next request, without needing to run any commands.
