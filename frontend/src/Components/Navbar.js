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


import { MoonIcon, SunIcon, SettingsIcon } from '@chakra-ui/icons';

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
            <div className='navbarButtons'>
                <IconButton
                    aria-label='dark mode'
                    icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                    onClick={() => toggleColorMode()}
                />
                <IconButton
                    aria-label='dark mode'
                    icon={<SettingsIcon />}
                />
            </div>
        </nav>
    );
}

export default Navbar;