import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration.js';

import {
    ChakraProvider,
    ColorModeScript,
    extendTheme,
} from '@chakra-ui/react'

const theme = extendTheme({
    colors: {
        sydneyTrains: {
            50: '#fff3da',
            100: '#ffdcae',
            200: '#ffc67d',
            300: '#ffaf4b',
            400: '#ff981a',
            500: '#e67f00',
            600: '#b36300',
            700: '#c26b00',
            800: '#4f2900',
            900: '#1f0c00'
        },
        sydneyBuses: {
            50: '#d8fbff',
            100: '#abecff',
            200: '#7adfff',
            300: '#48d1ff',
            400: '#1ac4ff',
            500: '#00aae6',
            600: '#0085b4',
            700: '#005f82',
            800: '#003a51',
            900: '#001520',
        },
        sydneyMetro: {
            50: '#ffe4e6',
            100: '#fcb9bb',
            200: '#f48c90',
            300: '#ed5e65',
            400: '#e73239',
            500: '#cd1820',
            600: '#a11118',
            700: '#730911',
            800: '#470408',
            900: '#1f0000',
        }
    },
    initialColorMode: 'dark',
    useSystemColorMode: false
});

ReactDOM.render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <App />
        </ChakraProvider>
    </React.StrictMode >,
    document.getElementById('root')
);

serviceWorkerRegistration.register();