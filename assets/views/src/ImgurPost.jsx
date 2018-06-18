const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-imgur-post"
  }, props);

  return <div className={props.class}>
            <h2>{props.title}</h2>
            <a href={props.imageLink} target="_blank">
                <span>{props.tagNumber}</span>
                <span>{props.tagCredit}</span>
                <img data-src={props.thumbnail} />
            </a>
          </div>;
}

module.exports = renderReact('ImgurPost', TheComponent);