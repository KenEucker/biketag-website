'use strict';

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-tag-it"
  }, props);

  return React.createElement(
    'form',
    { id: 'uploadForm' },
    React.createElement(
      'div',
      { 'class': 'field half first' },
      React.createElement(
        'h3',
        { id: 'proofHeading' },
        'Proof Information'
      ),
      React.createElement(
        'label',
        { 'for': 'currentTag' },
        'Image proof you found the mystery location'
      ),
      React.createElement('input', { type: 'file', name: 'currentTag' })
    ),
    React.createElement(
      'div',
      { 'class': 'field half' },
      React.createElement(
        'h3',
        { id: 'nextTagHeading' },
        'Mext Tag Info'
      ),
      React.createElement(
        'label',
        { 'for': 'nextTag' },
        'Image of the next tag location'
      ),
      React.createElement('input', { type: 'file', name: 'nextTag' })
    ),
    React.createElement(
      'div',
      { 'class': 'field half first' },
      React.createElement(
        'label',
        { 'for': 'location' },
        'Location of the last tag:'
      ),
      React.createElement('input', { type: 'text', name: 'location', placeholder: 'location' })
    ),
    React.createElement(
      'div',
      { 'class': 'field half' },
      React.createElement(
        'label',
        { 'for': 'hint' },
        'Hint for the next tag:'
      ),
      React.createElement('input', { type: 'text', name: 'hint', placeholder: 'hint' })
    ),
    React.createElement(
      'div',
      { 'class': 'field' },
      React.createElement(
        'label',
        { 'for': 'name' },
        'Who are you?'
      ),
      React.createElement('input', { type: 'text', name: 'name', placeholder: 'name' })
    ),
    React.createElement(
      'ul',
      { 'class': 'actions' },
      React.createElement(
        'li',
        null,
        React.createElement(
          'button',
          { id: 'submit' },
          'Tag IT!'
        )
      )
    )
  );
}

module.exports = renderReact('TagIt', TheComponent);