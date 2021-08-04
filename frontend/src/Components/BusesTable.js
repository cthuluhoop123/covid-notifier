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

function BusesTable({ cases }) {
    if (!cases) {
        return <Skeleton height='60px' />;
    }
    if (!cases.buses.length) {
        return <Text className='noCases' fontSize='md'>No recent bus cases...🤔</Text>;
    }
    return (
        <SlideFade key={1} in={true}>
            <Table
                variant='striped'
                size='sm'
                colorScheme='sydneyBuses'
            >
                <TableCaption className='tableCaption' placement='top'>
                    Buses
                </TableCaption>
                <Thead>
                    <Tr>
                        <Th>Route</Th>
                        <Th>Trip</Th>
                        <Th>Time</Th>
                        <Th>Updated</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {
                        cases.buses.map((busCase, i) => {
                            return (
                                <Tr key={i} className='row'>
                                    <Td>{busCase.route}</Td>
                                    <Td><strong>{busCase.start_location}</strong> - <strong>{busCase.end_location}</strong></Td>
                                    <Td>
                                        <p className='slightEmphasis'>{busCase.date_of_exposure}</p>
                                        <p className='faded'>{busCase.time_of_exposure}</p>
                                    </Td>
                                    <Td>
                                        <Text as='i'>{busCase.last_updated}</Text>
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

export default BusesTable;