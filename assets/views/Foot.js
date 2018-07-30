'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {

  return React.createElement(
    'div',
    null,
    React.createElement('script', { src: 'assets/js/jquery.min.js' }),
    React.createElement('script', { src: 'assets/js/skel.min.js' }),
    React.createElement('script', { src: 'assets/js/util.js' }),
    React.createElement('script', { src: 'assets/js/main.js', async: true }),
    React.createElement('script', { src: 'assets/js/imgurIntegration.js', async: true }),
    React.createElement('script', { src: 'assets/js/redditIntegration.js', async: true }),
    React.createElement('script', { src: 'assets/js/biketag.js', async: true }),
  );
}

module.exports = renderReact('Foot', TheComponent);