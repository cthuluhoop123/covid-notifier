import {
    Text,
    Thead,
    Tbody,
    Tr,
    Th,
    Table,
    Td,
    SlideFade,
    TableCaption,
    Skeleton,
} from '@chakra-ui/react';

import { WarningTwoIcon } from '@chakra-ui/icons';

function VenuesTable({ cases }) {
    if (!cases) {
        return <Skeleton height='60px' />;
    }
    if (!cases.length) {
        return <Text className='noCases' fontSize='md'>No cases near you. Neat!</Text>;
    }
    return (
        <SlideFade key={1} in={true}>
            <Table
                variant='striped'
                size='sm'
                colorScheme='pink'
            >
                <TableCaption className='tableCaption' placement='top'>
                    <p>Latest updated cases near you</p>
                    <p><WarningTwoIcon /> - close contact</p>
                </TableCaption>
                <Thead>
                    <Tr>
                        <Th></Th>
                        <Th>Suburb</Th>
                        <Th>Location</Th>
                        <Th>Exposure Time</Th>
                        <Th>Updated</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {
                        cases.map((covid, i) => {
                            return (
                                <Tr key={i} className='row'>
                                    <Td>
                                        {
                                            covid.contact === 'Close'
                                                ? <WarningTwoIcon />
                                                : null
                                        }
                                    </Td>
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
        </SlideFade>

    );
}

export default VenuesTable;