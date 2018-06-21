'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {

	return React.createElement(
		'head',
		null,
		React.createElement('script', { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=UA-119956764-1' }),
		React.createElement(
			'script',
			null,
			'window.dataLayer = window.dataLayer || []; function gtag()',
			dataLayer.push(arguments),
			'gtag(\'js\', new Date()); gtag(\'config\', \'UA-119956764-1\');'
		),
		React.createElement(
			'title',
			null,
			'BIKE TAG'
		),
		React.createElement('meta', { charset: 'utf-8' }),
		React.createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1, user-scalable=no' }),
		React.createElement('meta', { 'http-equiv': 'X-UA-Compatible', content: 'IE=9;IE=10;IE=Edge,chrome=1' }),
		React.createElement('script', { src: 'assets/js/modernizr.custom.80028.js' }),
		React.createElement('link', { rel: 'stylesheet', href: 'assets/css/main.css' }),
		React.createElement('link', { rel: 'stylesheet', href: 'assets/css/views.css' }),
		React.createElement(
			'noscript',
			null,
			React.createElement('link', { rel: 'stylesheet', href: 'assets/css/noscript.css' })
		)
	);
}

module.exports = renderReact('Head', TheComponent);