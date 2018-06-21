const React = require('react');
const renderReact = require('hypernova-react').renderReact;

import {Header} from './Header.js';
import {Articles} from './Articles.js';
import {Foot} from './Foot.js';

function TheComponent(props) {
//   props = Object.assign({
//   }, props);

  return <body>
      <div id="wrapper">
        <div id="countChanger">
            <nav>
                <ul>
                    <li><a href="?count=10">10</a></li>
                    <li><a href="?count=50">50</a></li>
                    <li><a href="?count=all">all</a></li>
                </ul>
            </nav>
        </div>

        <Header />
        <Articles />

        <footer id="footer">
            <p class="copyright">BikeTag is an open source website <a href="https://github.com/KenEucker/biketag-website">developed on github </a></p>
        </footer>

    </div>

    <div id="bg"></div>
    <Foot />
</body>;
}

module.exports = renderReact('Body', TheComponent);
