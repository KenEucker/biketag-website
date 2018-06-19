'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-how-to"
  }, props);

  return React.createElement(
    'div',
    { className: props.class },
    React.createElement(
      'h2',
      { className: 'major' },
      'How To'
    ),
    React.createElement(
      'h3',
      null,
      'HOW TO PLAY'
    ),
    React.createElement(
      'p',
      null,
      'You must discover the \u201Cmystery location\u201D and take a picture of your bike there. Then you must bike to a new "mystery location" of your choosing and take a picture of your bike there. Submit both pictures to the ',
      React.createElement(
        'strong',
        null,
        'TAG IT!'
      ),
      ' section. NOTE: you may not "reserve" being "IT" by immediately posting a photo of your bike in the old "mystery location" before finding and posting a picture of the new "mystery location."'
    ),
    React.createElement(
      'h3',
      null,
      'THE RULES'
    ),
    React.createElement(
      'p',
      null,
      'Mystery locations must be freely accessible to the public and by bicycle. Mystery locations should be unique/interesting/identifiable. Tags that include only nondescript features (blank walls) are not acceptable and will be removed. Mystery locations may not be mobile objects (food trucks, for example). Discovered mystery locations and new mystery locations must be tagged with the same bicycle, on the same ride. Pictures of discovered mystery locations and new mystery locations must be posted at the same time.'
    )
  );
}

module.exports = renderReact('HowTo', TheComponent);