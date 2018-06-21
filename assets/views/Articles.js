'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-articles"
  }, props);

  return React.createElement(
    'div',
    { id: 'main', className: props.class },
    React.createElement('article', { id: 'tagit' }),
    React.createElement('article', { id: 'howto' }),
    React.createElement('article', { id: 'about' }),
    React.createElement('article', { id: 'contact' })
  );
}

module.exports = renderReact('Articles', TheComponent);