const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {

  return <head>
		<script async src="https://www.googletagmanager.com/gtag/js?id=UA-119956764-1"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments)}
			gtag('js', new Date());

			gtag('config', 'UA-119956764-1');
		</script>

		<title>BIKE TAG</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
		<meta http-equiv="X-UA-Compatible" content="IE=9;IE=10;IE=Edge,chrome=1"/>
		<script src="assets/js/modernizr.custom.80028.js"></script>
		<link rel="stylesheet" href="assets/css/main.css" />
		<link rel="stylesheet" href="assets/css/views.css" />
		<noscript><link rel="stylesheet" href="assets/css/noscript.css" /></noscript>
  </head>;
}

module.exports = renderReact('Head', TheComponent);
