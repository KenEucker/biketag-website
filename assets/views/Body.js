'use strict';

var _Header = require('./Header.js');

var _Articles = require('./Articles.js');

var _Foot = require('./Foot.js');

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function TheComponent(props) {
    //   props = Object.assign({
    //   }, props);

    return React.createElement(
        'body',
        null,
        React.createElement(
            'div',
            { id: 'wrapper' },
            React.createElement(
                'div',
                { id: 'countChanger' },
                React.createElement(
                    'nav',
                    null,
                    React.createElement(
                        'ul',
                        null,
                        React.createElement(
                            'li',
                            null,
                            React.createElement(
                                'a',
                                { href: '?count=10' },
                                '10'
                            )
                        ),
                        React.createElement(
                            'li',
                            null,
                            React.createElement(
                                'a',
                                { href: '?count=50' },
                                '50'
                            )
                        ),
                        React.createElement(
                            'li',
                            null,
                            React.createElement(
                                'a',
                                { href: '?count=all' },
                                'all'
                            )
                        )
                    )
                )
            ),
            React.createElement(_Header.Header, null),
            React.createElement(_Articles.Articles, null),
            React.createElement(
                'footer',
                { id: 'footer' },
                React.createElement(
                    'p',
                    { 'class': 'copyright' },
                    'BikeTag is an open source website ',
                    React.createElement(
                        'a',
                        { href: 'https://github.com/KenEucker/biketag-website' },
                        'developed on github '
                    )
                )
            )
        ),
        React.createElement('div', { id: 'bg' }),
        React.createElement(_Foot.Foot, null)
    );
}

module.exports = renderReact('Body', TheComponent);