import {
    Text,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Table,
    SlideFade,
    TableCaption,
    Skeleton
} from '@chakra-ui/react';

function TrainsTable({ cases }) {
    if (!cases) {
        return <Skeleton height='60px' />;
    }
    if (!cases.trains.length) {
        return <Text className='noCases' fontSize='md'>No recent train cases...🤔</Text>;
    }
    return (
        <SlideFade key={1} in={true}>
            <Table
                variant='striped'
                size='sm'
                colorScheme='sydneyTrains'
            >
                <TableCaption className='tableCaption' placement='top'>
                    Trains
            </TableCaption>
                <Thead>
                    <Tr>
                        <Th>Route</Th>
                        <Th>Trip Start</Th>
                        <Th>Trip End</Th>
                        <Th>Exposure Time</Th>
                        <Th>Updated</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {
                        cases.trains.map((trainCase, i) => {
                            return (
                                <Tr key={i} className='row'>
                                    <Td>{trainCase.route}</Td>
                                    <Td>
                                        <strong>{trainCase.start_location}</strong>
                                    </Td>
                                    <Td>
                                        <strong>{trainCase.end_location}</strong>
                                    </Td>
                                    <Td>
                                        <p className='slightEmphasis'>{trainCase.date_of_exposure}</p>
                                        <p className='faded'>{trainCase.time_of_exposure}</p>
                                    </Td>
                                    <Td>
                                        <Text as='i'>{trainCase.last_updated}</Text>
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

export default TrainsTable;