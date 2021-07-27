import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import { ChakraProvider, ColorModeScript, extendTheme, useColorMode } from '@chakra-ui/react'

const theme = extendTheme({
    initialColorMode: 'dark',
    useSystemColorMode: false
});

ReactDOM.render(
    <React.StrictMode>
        <ChakraProvider>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <App />
        </ChakraProvider>
    </React.StrictMode >,
    document.getElementById('root')
);
