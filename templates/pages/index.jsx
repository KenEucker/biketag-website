const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function ThePage(props) {
  props = Object.assign({
    class: "m-contact"
  }, props);

  return  <Head />
          <Body />;
}

module.exports = renderReact('Contact', ThePage);