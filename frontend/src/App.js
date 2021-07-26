import React from 'react';
import './App.css';

import { Heading } from "@chakra-ui/react";
import { Input } from "@chakra-ui/react";

function App() {
    return (
        <div className='content'>
            <Heading>Locations:</Heading>
            <Input placeholder="Basic usage" />
        </div>
    );
}

export default App;
