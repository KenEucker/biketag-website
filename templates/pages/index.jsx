const React = require('react');
const renderReact = require('hypernova-react').renderReact;

import {Body} from '../views/Body.js';
import {Header} from '../views/Header.js';
import {Articles} from '../views/Articles.js';
import {Foot} from '../views/Foot.js';

function ThePage(props) {
  props = Object.assign({
    class: ""
  }, props);
  return <div id="wrapper">
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
          <p className="copyright">BikeTag is an open source website <a href="https://github.com/KenEucker/biketag-website">developed on github </a></p>
      </footer>
    </div>
}

module.exports = renderReact('Index', ThePage);