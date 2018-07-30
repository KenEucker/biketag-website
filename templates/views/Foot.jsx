const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {

  return <div> 	
    <script src="assets/js/jquery.min.js"></script>
    <script src="assets/js/skel.min.js"></script>
    <script src="assets/js/util.js"></script>
    <script src="assets/js/main.js" async></script>
    <script src="assets/js/imgurIntegration.js" async></script>
    <script src="assets/js/redditIntegration.js" async></script>
    <script src="assets/js/biketag.js" async></script>
  </div>;
}

module.exports = renderReact('Foot', TheComponent);
