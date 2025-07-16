import { Container, Title, Paper, Stack, Divider } from '@mantine/core';
import { ConnectionStatus } from './components/ConnectionStatus';

function App() {
    return (
        <Container size="sm" mt="xl">
            <Stack>
                <Paper withBorder shadow="md" p="md" radius="md">
                    <Stack>
                        <Title order={2}>Cihaz Kontrol Paneli</Title>
                        <ConnectionStatus />
                    </Stack>
                </Paper>

                <Paper withBorder shadow="md" p="md" radius="md">
                    <Title order={3} mb="md">Motor Kontrolleri</Title>
                    <Divider my="sm" />
                    {/* Diğer kontrol bileşenleri (Hız, Açı vb.) buraya gelecek */}
                    <p>Hız kontrolü ve diğer ayarlar bu alanda yer alacak.</p>
                </Paper>
            </Stack>
        </Container>
    )
}

export default App