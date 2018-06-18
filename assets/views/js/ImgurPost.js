'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-imgur-post"
  }, props);

  return React.createElement(
    'div',
    { className: props.class },
    React.createElement(
      'h2',
      null,
      props.title
    ),
    React.createElement(
      'a',
      { href: props.imageLink, target: '_blank' },
      React.createElement(
        'span',
        null,
        props.tagNumber
      ),
      React.createElement(
        'span',
        null,
        props.tagCredit
      ),
      React.createElement('img', { 'data-src': props.thumbnail })
    )
  );
}

module.exports = renderReact('ImgurPost', TheComponent);