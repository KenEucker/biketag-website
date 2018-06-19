const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-about"
  }, props);

  return <div className={props.class}>
            <h2 class="major">About</h2>
				<h3>BIKE TAG GAME</h3>
				<p>
					<a href="http://atx.biketag.org">BikeTag in Austin, Texas</a><br/>
					<a href="http://pdx.biketag.org">BikeTag in Portland, Oregon</a><br/>
					<a href="http://chi.biketag.org">BikeTag in Chicago, Illinois</a><br/>
					<a href="http://atl.biketag.org">BikeTag in Atlanta, Georgia</a><br/>
					<a href="http://la.biketag.org">BikeTag in Los Angeles, California</a><br/>
					<a href="http://sea.biketag.org">BikeTag in Seattle, Washington</a><br/>
				</p>
				<p>BikeTag.org is a place for people to see the most recent Bike Tags in their city and participate in the game in an easy and simple way, without needing to login to anything. The game was originally found on /r/BikingATX, that was then adopted by /r/bikeLA, that was then adopted by /r/chibike. For reddit credit: /u/america_yall of /r/BikingATX who started the first run of the game.</p>
          </div>;
}

module.exports = renderReact('About', TheComponent);
