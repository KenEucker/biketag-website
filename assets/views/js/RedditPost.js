'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-reddit-post"
  }, props);

  return React.createElement(
    'div',
    { className: props.class },
    'Credit goes to: [',
    props.name,
    '] for finding tag ',
    props.lastNumber,
    '! [',
    props.nextNumber,
    ' Tag by ',
    props.name,
    '](',
    props.nextTag,
    ') [',
    props.lastNumber,
    ' Proof for ',
    props.name,
    '](',
    props.lastTag,
    ') [Rules](http://biketag.org/#howto)'
  );
}

module.exports = renderReact('ImgurPost', TheComponent);