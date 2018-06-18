const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-reddit-post"
  }, props);

  return <div className={props.class}>
            Credit goes to: [{props.name}] for finding tag {props.lastNumber}!
            [{props.nextNumber} Tag by {props.name}]({props.nextTag})
            [{props.lastNumber} Proof for {props.name}]({props.lastTag})
            [Rules](http://biketag.org/#howto)
          </div>;
}

module.exports = renderReact('ImgurPost', TheComponent);