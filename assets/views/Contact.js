'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-contact"
  }, props);

  return React.createElement(
    'div',
    { className: props.class },
    React.createElement(
      'h2',
      { 'class': 'major' },
      'Contact'
    ),
    React.createElement(
      'p',
      null,
      'To get ahold of us at BikeTag send an ',
      React.createElement(
        'a',
        { mailto: 'hello@biketag.org' },
        'email'
      ),
      ' to hello@biketag.org'
    )
  );
}

module.exports = renderReact('Contact', TheComponent);