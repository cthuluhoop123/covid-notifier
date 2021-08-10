import {
    Text,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Table,
    TableCaption,
    SlideFade,
    Skeleton
} from '@chakra-ui/react';

function MetroTable({ cases }) {
    if (!cases) {
        return <Skeleton height='60px' />;
    }
    if (!cases.metro.length) {
        return <Text className='noCases' fontSize='md'>No recent metro cases...🤔</Text>;
    }
    return (
        <SlideFade key={1} in={true}>
            <Table
                variant='striped'
                size='sm'
                colorScheme='sydneyMetro'
            >
                <TableCaption className='tableCaption' placement='top'>
                    Metro
        </TableCaption>
                <Thead>
                    <Tr>
                        <Th>Route</Th>
                        <Th>Trip Start</Th>
                        <Th>Trip Stop</Th>
                        <Th>Exposure Time</Th>
                        <Th>Updated</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {
                        cases.metro.map((metroCase, i) => {
                            return (
                                <Tr key={i} className='row'>
                                    <Td>{metroCase.route}</Td>
                                    <Td><strong>{metroCase.start_location}</strong></Td>
                                    <Td><strong>{metroCase.end_location}</strong></Td>
                                    <Td>
                                        <p className='slightEmphasis'>{metroCase.date_of_exposure}</p>
                                        <p className='faded'>{metroCase.time_of_exposure}</p>
                                    </Td>
                                    <Td>
                                        <Text as='i'>{metroCase.last_updated}</Text>
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

export default MetroTable;