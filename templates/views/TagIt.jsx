const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
  props = Object.assign({
    class: "m-tag-it"
  }, props);

  return <form id="uploadForm">
          <div class="field half first">
            <h3 id="proofHeading">Proof Information</h3>
            <label for="currentTag">Image proof you found the mystery location</label>
            <input type="file" name="currentTag" />
          </div>
          <div class="field half">
            <h3 id="nextTagHeading">Mext Tag Info</h3>
            <label for="nextTag">Image of the next tag location</label>
            <input type="file" name="nextTag" />
          </div>
          <div class="field half first">
            <label for="location">Location of the last tag:</label>
            <input type="text" name="location" placeholder="location" />
          </div>
          <div class="field half">
            <label for="hint">Hint for the next tag:</label>
            <input type="text" name="hint" placeholder="hint" />
          </div>
          <div class="field">
            <label for="name">Who are you?</label>
            <input type="text" name="name" placeholder="name" />
          </div>
          <ul class="actions">
            <li><button id="submit">Tag IT!</button></li>
          </ul>
        </form>;
}

module.exports = renderReact('TagIt', TheComponent);
