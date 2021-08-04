import {
    Heading,
    Text,
    UnorderedList,
    Skeleton,
    useToast,
    SimpleGrid,
    Box,
    useColorMode,
    IconButton,
    SlideFade,
} from '@chakra-ui/react';


import {MoonIcon, SunIcon } from '@chakra-ui/icons';

function Navbar() {
    const { colorMode, toggleColorMode } = useColorMode();

    return (
        <nav>
            <Heading
                as='h1'
                size='xl'
            >
                <span className='heading'>COVID-19</span>
            </Heading>
            <IconButton
                aria-label='dark mode'
                icon={colorMode === 'light' ? <MoonIcon color='black' /> : <SunIcon color='white' />}
                onClick={() => toggleColorMode()}
            />
        </nav>
    );
}

export default Navbar;