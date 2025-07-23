// fue-control-system-main/frontend/src/App.tsx
import { useEffect, useRef } from 'react';
import { Container, Title, Stack, SimpleGrid, Tabs } from '@mantine/core';
import { IconGauge, IconTerminal2 } from '@tabler/icons-react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { SpeedControl } from './components/SpeedControl';
import { ModeControl } from './components/ModeControl';
import { AngleControl } from './components/AngleControl';
import { TorqueMonitor } from './components/TorqueMonitor';
import { TimerControl } from './components/TimerControl';
import { Console } from './components/Console'; // Yeni konsolu import et
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import { useWebSocketStore } from './stores/useWebSocketStore';

function App() {
    const lastMessage = useWebSocketStore((state) => state.lastMessage);
    const lastMessageRef = useRef(null);

    useEffect(() => {
        if (lastMessage && lastMessage !== lastMessageRef.current) {
            lastMessageRef.current = lastMessage;
            if (lastMessage.type === 'DEVICE_RESPONSE' && lastMessage.payload === 'e') {
                notifications.show({
                    title: 'Cihaz Hatası',
                    message: 'Gönderilen komut anlaşılamadı veya bir hata oluştu.',
                    color: 'red',
                    icon: <IconX />,
                    autoClose: 5000,
                });
            }
        }
    }, [lastMessage]);

    return (
        <Container size="xl" my="xl">
            <Stack>
                <Title order={1}>FUE Motor Kontrol Arayüzü</Title>
                <ConnectionStatus />

                <Tabs defaultValue="control_panel">
                    <Tabs.List>
                        <Tabs.Tab value="control_panel" leftSection={<IconGauge size={16} />}>
                            Kontrol Paneli
                        </Tabs.Tab>
                        <Tabs.Tab value="console" leftSection={<IconTerminal2 size={16} />}>
                            Konsol
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="control_panel" pt="md">
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                            <Stack>
                                <TimerControl/>
                            </Stack>
                            <Stack style={{ gridColumn: 'span 2' }}>
                                <SpeedControl />
                                <ModeControl />
                                <AngleControl/>
                                <TorqueMonitor/>
                            </Stack>
                        </SimpleGrid>
                    </Tabs.Panel>

                    <Tabs.Panel value="console" pt="md" style={{ height: '70vh' }}>
                        <Console />
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}

export default App;