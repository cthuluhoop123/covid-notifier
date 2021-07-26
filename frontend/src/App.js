import React, { useState, useEffect } from 'react';
import './App.css';

import request from 'superagent';

import {
    Heading,
    Input,
    Text,
    UnorderedList,
    Skeleton,
    SkeletonCircle,
    SkeletonText,
    Button,
    InputGroup
} from '@chakra-ui/react';

function App() {
    const [uuid, setUuid] = useState(localStorage.getItem('id'));
    const [postcodes, setPostcodes] = useState(null);

    const [postcodeForm, setPostcodeForm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!uuid) {
            request
                .post(process.env.REACT_APP_SERVER + '/createUser')
                .then(res => {
                    setUuid(res.body.id);
                    localStorage.setItem('id', res.body.id);
                    setPostcodes([]);
                });
        } else {
            request
                .get(process.env.REACT_APP_SERVER + '/configuration')
                .query({ id: uuid })
                .then(res => {
                    setPostcodes(
                        res.body.sort((a, b) => a.suburb.localeCompare(b.suburb))
                    );
                });
        }
    }, []);

    const renderSuburbs = () => {
        if (!postcodes) {
            // loading
            return <Skeleton height='20px' />;
        }

        if (postcodes.length === 0) {
            return <Text fontSize='sm'>Nothing yet. Add a few suburbs :)</Text>
        }

        return postcodes.map(postcode => {
            return <Text fontSize='md'>{postcode.suburb} ({postcode.postcode})</Text>
        });
    };

    const configure = () => {
        if (!postcodeForm) {
            return;
        }

        request
            .post(process.env.REACT_APP_SERVER + '/configure')
            .send({
                id: uuid,
                postcodes: [...postcodes.map(postcode => postcode.postcode), postcodeForm]
            })
            .then(res => {
                setPostcodeForm('');
                setPostcodes(
                    res.body.sort((a, b) => a.suburb.localeCompare(b.suburb))
                );
                setError('');
            })
            .catch(err => {
                setError('Invalid postcode.');
            });
    };

    return (
        <div className='content'>
            <Heading size='2xl'>Locations:</Heading>
            <div className='add'>
                <InputGroup>
                    <Input
                        value={postcodeForm}
                        isInvalid={error}
                        type='number'
                        placeholder='Postcode'
                        onChange={e => {
                            setPostcodeForm(e.target.value);
                        }}
                    />
                    <Button
                        colorScheme='messenger'
                        onClick={configure}
                        disabled={!postcodeForm}
                    >
                        Add
                    </Button>
                </InputGroup>
            </div>
            <UnorderedList>
                {renderSuburbs()}
            </UnorderedList>
        </div>
    );
}

export default App;
