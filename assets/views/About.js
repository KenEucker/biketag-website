'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
		props = Object.assign({
				class: "m-about"
		}, props);

		return React.createElement(
				'div',
				{ className: props.class },
				React.createElement(
						'h2',
						{ 'class': 'major' },
						'About'
				),
				React.createElement(
						'h3',
						null,
						'BIKE TAG GAME'
				),
				React.createElement(
						'p',
						null,
						React.createElement(
								'a',
								{ href: 'http://atx.biketag.org' },
								'BikeTag in Austin, Texas'
						),
						React.createElement('br', null),
						React.createElement(
								'a',
								{ href: 'http://pdx.biketag.org' },
								'BikeTag in Portland, Oregon'
						),
						React.createElement('br', null),
						React.createElement(
								'a',
								{ href: 'http://chi.biketag.org' },
								'BikeTag in Chicago, Illinois'
						),
						React.createElement('br', null),
						React.createElement(
								'a',
								{ href: 'http://atl.biketag.org' },
								'BikeTag in Atlanta, Georgia'
						),
						React.createElement('br', null),
						React.createElement(
								'a',
								{ href: 'http://la.biketag.org' },
								'BikeTag in Los Angeles, California'
						),
						React.createElement('br', null),
						React.createElement(
								'a',
								{ href: 'http://sea.biketag.org' },
								'BikeTag in Seattle, Washington'
						),
						React.createElement('br', null)
				),
				React.createElement(
						'p',
						null,
						'BikeTag.org is a place for people to see the most recent Bike Tags in their city and participate in the game in an easy and simple way, without needing to login to anything. The game was originally found on /r/BikingATX, that was then adopted by /r/bikeLA, that was then adopted by /r/chibike. For reddit credit: /u/america_yall of /r/BikingATX who started the first run of the game.'
				)
		);
}

module.exports = renderReact('About', TheComponent);