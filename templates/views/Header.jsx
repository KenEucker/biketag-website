const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-header"
  }, props);

  return <header id="header">
    <div class="logo spin">
      <span class="icon fa-bicycle"></span>
    </div>
    <div class="headingText">
      <h1>BIKE</h1>
      <h1>TAG</h1>
    </div>
    <div class="content">
      <div class="inner">
      </div>
    </div>
    <nav>
      <ul>
        <li><a id="tagItButton" href="#tagit">Tag it!</a></li>
        <li><a href="#howto">How To</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>;
}

module.exports = renderReact('Header', TheComponent);
