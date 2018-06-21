'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-header"
  }, props);

  return React.createElement(
    'header',
    { id: 'header' },
    React.createElement(
      'div',
      { 'class': 'logo spin' },
      React.createElement('span', { 'class': 'icon fa-bicycle' })
    ),
    React.createElement(
      'div',
      { 'class': 'headingText' },
      React.createElement(
        'h1',
        null,
        'BIKE'
      ),
      React.createElement(
        'h1',
        null,
        'TAG'
      )
    ),
    React.createElement(
      'div',
      { 'class': 'content' },
      React.createElement('div', { 'class': 'inner' })
    ),
    React.createElement(
      'nav',
      null,
      React.createElement(
        'ul',
        null,
        React.createElement(
          'li',
          null,
          React.createElement(
            'a',
            { id: 'tagItButton', href: '#tagit' },
            'Tag it!'
          )
        ),
        React.createElement(
          'li',
          null,
          React.createElement(
            'a',
            { href: '#howto' },
            'How To'
          )
        ),
        React.createElement(
          'li',
          null,
          React.createElement(
            'a',
            { href: '#about' },
            'About'
          )
        ),
        React.createElement(
          'li',
          null,
          React.createElement(
            'a',
            { href: '#contact' },
            'Contact'
          )
        )
      )
    )
  );
}

module.exports = renderReact('Header', TheComponent);