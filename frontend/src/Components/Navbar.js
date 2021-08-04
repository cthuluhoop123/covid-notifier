import { useEffect, useState } from 'react';

import {
    Heading,
    useColorMode,
    IconButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    HStack
} from '@chakra-ui/react';


import { MoonIcon, SunIcon, SettingsIcon } from '@chakra-ui/icons';

function Navbar(props) {
    const [maxDist, setMaxDist] = useState(props.maxDist);

    useEffect(() => {
        setMaxDist(props.maxDist);
    }, [props.maxDist]);

    const { colorMode, toggleColorMode } = useColorMode();
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <nav>
            <Heading
                as='h1'
                size='xl'
            >
                <span className='heading'>COVID-19</span>
            </Heading>
            <div className='navbarButtons'>
                <IconButton
                    aria-label='dark mode'
                    icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                    onClick={() => toggleColorMode()}
                />
                <IconButton
                    aria-label='dark mode'
                    onClick={onOpen}
                    icon={<SettingsIcon />}
                />
            </div>
            <Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Settings</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div>
                            <Text fontWeight='bold'>
                                Max distance
                            </Text>
                            <Text fontSize='sm' mb='1rem'>
                                Venues beyond this distance from your first suburb will not show.
                            </Text>
                        </div>
                        <HStack>
                            <NumberInput
                                defaultValue={10}
                                min={1}
                                max={15}
                                width='10rem'
                                value={maxDist}
                                onChange={e => {
                                    setMaxDist(e);
                                }}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                            <Text>km</Text>
                        </HStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant='ghost'
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme='blue'
                            mr={3}
                            onClick={() => {
                                props.setMaxDist(maxDist);
                                localStorage.setItem('maxDistance', maxDist);
                                onClose();
                            }}
                        >

                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </nav>
    );
}

export default Navbar;