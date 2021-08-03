import React, { useState, useEffect } from 'react';
import './App.css';

import request from 'superagent';

import notifySw from './notifyServiceWorkerRegister.js';

import {
    Heading,
    Text,
    UnorderedList,
    Skeleton,
    useToast,
    SimpleGrid,
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useColorMode,
    TableCaption,
    SlideFade
} from '@chakra-ui/react';

import {
    AutoComplete,
    AutoCompleteInput,
    AutoCompleteItem,
    AutoCompleteList,
} from '@choc-ui/chakra-autocomplete';

import { CloseIcon } from '@chakra-ui/icons';


function App() {
    const { toggleColorMode } = useColorMode();

    const [uuid, setUuid] = useState(localStorage.getItem('id'));
    const [postcodeSIDs, setPostcodeSIDs] = useState(null);

    const [postcodeSearch, setPostcodeSearch] = useState('');

    const [suburbs, setSuburbs] = useState(null);

    const [covidCases, setCovidCases] = useState(null);

    const [error, setError] = useState('');

    const toast = useToast();

    const registerNotifications = uuid => {
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
                    toast({
                        title: 'No notification permissions',
                        description: 'We won\'t be able to send you notifications :(',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    })
                    console.error(err.message);
                });
        }
    };

    useEffect(() => {
        if (!uuid) {
            request
                .post(process.env.REACT_APP_SERVER + '/createUser')
                .then(res => {
                    setUuid(res.body.id);
                    setPostcodeSIDs([]);
                    setCovidCases([]);
                    localStorage.setItem('id', res.body.id);
                    return res.body.id;
                })
                .then(uuid => {
                    registerNotifications(uuid);
                });
        } else {
            registerNotifications(uuid);

            request
                .get(process.env.REACT_APP_SERVER + '/configuration')
                .query({ id: uuid })
                .then(res => {
                    setPostcodeSIDs(res.body);
                });
        }
    }, []);

    useEffect(() => {
        if (!uuid || !postcodeSIDs) {
            return;
        }
        updateNearCases();
    }, [postcodeSIDs]);

    useEffect(() => {
        if (error) {
            toast({
                title: error,
                status: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }, [error]);

    const updateNearCases = () => {
        request
            .get(process.env.REACT_APP_SERVER + '/nearCases')
            .query({ id: uuid })
            .then(res => {
                setCovidCases(
                    res.body
                        .reduce((acc, cur) => {
                            const existing = acc.find(place => {
                                return place.address === cur.address
                                    && place.suburb === cur.suburb
                                    && place.venue === cur.venue
                            });
                            if (!existing) {
                                acc.push({
                                    address: cur.address,
                                    times: [{
                                        date: cur.date,
                                        time: cur.time
                                    }],
                                    suburb: cur.suburb,
                                    updated: cur.updated,
                                    venue: cur.venue,
                                    distance: cur.distance,
                                    latlng: cur.latlng
                                });
                            } else {
                                existing.times.push({
                                    date: cur.date,
                                    time: cur.time
                                });
                            }
                            return acc;
                        }, [])
                        .sort((a, b) => {
                            // Sort by distance and then by recency
                            const distanceDiff = a.distance - b.distance;
                            const dateDiff = new Date(b.updated) - new Date(a.updated);
                            if (dateDiff !== 0) {
                                return dateDiff;
                            } else {
                                return distanceDiff
                            }
                        })
                );
            })
            .catch(err => {
                console.error(err);
            });
    };

    const configure = (newSuburbSID, remove = false) => {
        if (!newSuburbSID) {
            return;
        }

        const newPostcodeSIDs = [...postcodeSIDs.map(postcode => postcode.sid)];
        if (!remove) {
            newPostcodeSIDs.push(newSuburbSID);
        } else {
            newPostcodeSIDs.splice(newPostcodeSIDs.indexOf(newSuburbSID), 1);
        }

        return request
            .post(process.env.REACT_APP_SERVER + '/configure')
            .send({
                id: uuid,
                postcodeSIDs: newPostcodeSIDs
            })
            .then(res => {
                setPostcodeSIDs(res.body);

                if (!remove) {
                    toast({
                        title: 'Suburb added',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                    })
                } else {
                    toast({
                        title: 'Suburb deleted',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                    })

                }

                setError('');
            })
            .catch(err => {
                if (err.response) {
                    setError(err.response.body.error);
                } else {
                    setError('Invalid postcode.');
                }
                throw err;
            });
    };

    const renderSuburbs = () => {
        if (!postcodeSIDs) {
            // loading
            return <Skeleton height='20px' />;
        }

        if (postcodeSIDs.length === 0) {
            return <Text fontSize='sm'>Nothing yet. Add a few suburbs :)</Text>
        }

        return postcodeSIDs.map((postcode, i) => {
            return (
                <SimpleGrid key={i} columns={2} spacing={1} className='alignWithIcon'>
                    <Box>
                        <Text fontSize='sm'>{postcode.suburb} ({postcode.postcode})</Text>
                    </Box>
                    <Box className='iconText'>
                        <div onClick={e => {
                            configure(postcode.sid, true);
                        }}>
                            <CloseIcon style={{ textAlign: 'right' }} />
                        </div>
                    </Box>
                </SimpleGrid >
            );
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

    const renderTable = () => {
        if (!covidCases) {
            return <Skeleton height='60px' />;
        }

        const components = [];

        if (!covidCases.length) {
            components.push(
                <SlideFade key={0} in={true}>
                    <Text fontSize='sm'>No cases near you. Neat!</Text>
                </SlideFade>
            );
        } else {
            components.push(
                <SlideFade key={1} in={true}>
                    <div className='caseTable'>
                        <Table
                            variant='striped'
                            size='sm'
                            colorScheme='pink'
                        >
                            <TableCaption placement='top'>
                                Latest updated cases near you
                    </TableCaption>
                            <Thead>
                                <Tr>
                                    <Th>Suburb</Th>
                                    <Th>Location</Th>
                                    <Th>Time</Th>
                                    <Th>Updated</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {
                                    covidCases.map((covid, i) => {
                                        return (
                                            <Tr key={i} className='row'>
                                                <Td>{covid.suburb}</Td>
                                                <Td>
                                                    <a
                                                        target='_blank'
                                                        href={
                                                            `https://www.google.com/maps/search/?api=1&query=${covid.venue} ${covid.address}`
                                                        }
                                                    >
                                                        <strong>{covid.venue}</strong>
                                                        <p className='faded'>{covid.address}</p>
                                                    </a>
                                                </Td>
                                                <Td>
                                                    {
                                                        covid.times.map((time, i) => {
                                                            return (
                                                                <div key={i} className='caseDate'>
                                                                    <p className='slightEmphasis'>{time.date}</p>
                                                                    <p className='faded'>{time.time}</p>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                </Td>
                                                <Td>
                                                    <Text as='i'>{covid.updated}</Text>
                                                </Td>
                                            </Tr>
                                        );
                                    })
                                }
                            </Tbody>
                        </Table>
                    </div>
                </SlideFade>
            );
        }

        const now = new Date();

        components.push(
            <Text
                key={2}
                id='lastUpdated'
                size='sm'
                as='sub'
                onClick={() => {
                    setCovidCases(null);
                    updateNearCases();
                }}
            >
                Last updated: {
                    now
                        .getHours()
                        .toString()
                        .padStart(2, 0)
                }:{
                    now
                        .getMinutes()
                        .toString()
                        .padStart(2, 0)
                }
            </Text>
        );

        return components;
    };

    return (
        <div className='container'>
            <div className='content'>
                <Heading
                    as='h1'
                    size='xl'
                >
                    <span className='heading' onClick={() => toggleColorMode()}>COVID-19</span>
                </Heading>
                <br />
                <div className='externals'>
                    <Text size='sm' as='sup'>
                        <a href='https://www.nsw.gov.au/covid-19/nsw-covid-19-case-locations/exposure-locations'>
                            Go to ServiceNSW →
                        </a>
                    </Text>
                    <Text size='sm' as='sup'>
                        <a href='https://www.health.nsw.gov.au/Infectious/covid-19/Pages/stats-nsw.aspx#local'>
                            See latest stats →
                        </a>
                    </Text>
                </div>
                {renderTable()}
                <div className='subscribe'>
                    <AutoComplete
                        rollNavigation
                        shouldRenderSuggestions={value => {
                            return value.trim().length >= 3;
                        }}
                        maxSuggestions={5}
                    >
                        <AutoCompleteInput
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                }
                            }}
                            type='number'
                            variant='filled'
                            isInvalid={error}
                            placeholder='Add a suburb by postcode...'
                            autoFocus
                            value={postcodeSearch}
                            onChange={search => {
                                setPostcodeSearch(search.target.value);
                                if (search.target.value.length >= 3) {
                                    getSuburbs(search.target.value);
                                }
                            }}
                        />
                        <AutoCompleteList>
                            {
                                suburbs
                                    ? suburbs.map((suburb, i) => {
                                        return (
                                            <AutoCompleteItem
                                                key={i}
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
                    <div className='subscribedList'>
                        <Heading id='interested' as='h4' size='md'>
                            Areas you're interested in:
                    </Heading>
                        <UnorderedList>
                            {renderSuburbs()}
                        </UnorderedList>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default App;
