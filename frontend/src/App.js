import React, { useState, useEffect } from 'react';
import './App.css';

import request from 'superagent';

import notifySw from './notifyServiceWorkerRegister.js';

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

import {
    AutoComplete,
    AutoCompleteInput,
    AutoCompleteItem,
    AutoCompleteList,
} from '@choc-ui/chakra-autocomplete';


function App() {
    const [uuid, setUuid] = useState(localStorage.getItem('id'));
    const [postcodeSIDs, setPostcodeSIDs] = useState(null);

    const [postcodeSearch, setPostcodeSearch] = useState('');

    const [suburbs, setSuburbs] = useState(null);

    const [error, setError] = useState('');

    useEffect(() => {
        if (!uuid) {
            request
                .post(process.env.REACT_APP_SERVER + '/createUser')
                .then(res => {
                    setUuid(res.body.id);
                    setPostcodeSIDs([]);
                    localStorage.setItem('id', res.body.id);
                    return res.body.id;
                })
                .then(uuid => {
                    if ('serviceWorker' in navigator) {
                        notifySw.run()
                            .then(subscription => {
                                return request
                                    .post(process.env.REACT_APP_SERVER + '/subscribe/sub')
                                    .send({
                                        id: uuid,
                                        subscription: subscription.toJSON()
                                    });
                            })
                            .catch(err => {
                                // permission blocked
                                console.error(err.message);
                            });
                    }
                });
        } else {
            request
                .get(process.env.REACT_APP_SERVER + '/configuration')
                .query({ id: uuid })
                .then(res => {
                    setPostcodeSIDs(
                        res.body.sort((a, b) => a.suburb.localeCompare(b.suburb))
                    );
                });
        }
    }, []);

    const renderSuburbs = () => {
        if (!postcodeSIDs) {
            // loading
            return <Skeleton height='20px' />;
        }

        if (postcodeSIDs.length === 0) {
            return <Text fontSize='sm'>Nothing yet. Add a few suburbs :)</Text>
        }

        return postcodeSIDs.map(postcode => {
            console.log(postcode);
            return <Text fontSize='md'>{postcode.suburb} ({postcode.postcode})</Text>
        });
    };

    const configure = newSuburbSID => {
        if (!newSuburbSID) {
            return;
        }

        return request
            .post(process.env.REACT_APP_SERVER + '/configure')
            .send({
                id: uuid,
                postcodeSIDs: [...postcodeSIDs.map(postcode => postcode.sid), newSuburbSID]
            })
            .then(res => {
                setPostcodeSIDs(
                    res.body.sort((a, b) => a.suburb.localeCompare(b.suburb))
                );
                setError('');
            })
            .catch(err => {
                setError('Invalid postcode.');
                throw err;
            });
    };

    const getSuburbs = postcode => {
        request
            .get(process.env.REACT_APP_SERVER + '/suburbs')
            .query({ postcode })
            .then(res => {
                setSuburbs(res.body);
            });
    };

    return (
        <div className='content'>
            <Heading size='2xl'>Locations:</Heading>
            <AutoComplete
                rollNavigation
                shouldRenderSuggestions={value => {
                    return value.trim().length > 2;
                }}
                maxSuggestions={5}
            >
                <AutoCompleteInput
                    variant='filled'
                    isInvalid={error}
                    placeholder='Search...'
                    autoFocus
                    value={postcodeSearch}
                    onChange={search => {
                        setPostcodeSearch(search.target.value);
                        if (search.target.value.length === 4) {
                            getSuburbs(search.target.value);
                        }
                    }}
                />
                <AutoCompleteList>
                    {
                        suburbs
                            ? suburbs.map(suburb => {
                                return (
                                    <AutoCompleteItem
                                        key={suburb.sid}
                                        value={suburb.postcode}
                                        data-sid={suburb.sid}
                                        onClick={e => {
                                            configure(e.target.dataset.sid)
                                                .then(() => setPostcodeSearch(''))
                                                .catch(err => { });
                                        }}
                                    >
                                        {suburb.suburb}
                                    </AutoCompleteItem>
                                );
                            })
                            : null
                    }
                </AutoCompleteList>
            </AutoComplete>

            <UnorderedList>
                {renderSuburbs()}
            </UnorderedList>
        </div >
    );
}

export default App;
