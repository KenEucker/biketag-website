const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-contact"
  }, props);

  return  <div className={props.class}>
            <h2 class="major">Contact</h2>
            <p>
              To get ahold of us at BikeTag send an <a mailto="hello@biketag.org">email</a> to hello@biketag.org
            </p>
          </div>;
}

module.exports = renderReact('Contact', TheComponent);
