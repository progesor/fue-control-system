import { Container, Title, Stack, SimpleGrid } from '@mantine/core';
import { ConnectionStatus } from './components/ConnectionStatus';
import { SpeedControl } from './components/SpeedControl';

function App() {
    return (
        <Container size="xl" my="xl">
            <Stack>
                <Title order={1}>FUE Motor Kontrol Arayüzü</Title>

                {/* Ana yerleşim için Grid sistemi */}
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    {/* SOL SÜTUN (Ayarlar ve Durum) */}
                    <Stack>
                        <ConnectionStatus />
                        {/* Diğer ayar kartları buraya gelebilir */}
                    </Stack>

                    {/* SAĞ SÜTUN (Ana Kontroller - 2 birimlik yer kaplar) */}
                    <Stack style={{ gridColumn: 'span 2' }}>
                        <SpeedControl />
                        {/* Diğer ana kontrol kartları (Açı, Mod vb.) buraya gelecek */}
                    </Stack>
                </SimpleGrid>
            </Stack>
        </Container>
    );
}

export default App