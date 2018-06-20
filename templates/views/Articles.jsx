const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-articles"
  }, props);

  return <div id="main" className={props.class}>
    <article id="tagit">
    </article>

    <article id="howto">
    </article>

    <article id="about">
    </article>

    <article id="contact">
    </article>
</div>;
}

module.exports = renderReact('Articles', TheComponent);
