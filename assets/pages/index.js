'use strict';

var _Body = require('../views/Body.js');

var _Header = require('../views/Header.js');

var _Articles = require('../views/Articles.js');

var _Foot = require('../views/Foot.js');

var React = require('react');
var renderReact = require('hypernova-react').renderReact;

function ThePage(props) {
    props = Object.assign({
        class: ""
    }, props);
    return React.createElement(
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
    );
}

module.exports = renderReact('Index', ThePage);