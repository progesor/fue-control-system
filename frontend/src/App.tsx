import { useEffect, useRef } from 'react';
import { Container, Stack, SimpleGrid, Tabs, Group, Center, Paper, Text } from '@mantine/core';
import { IconGauge, IconTerminal2, IconBolt } from '@tabler/icons-react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { SpeedControl } from './components/SpeedControl';
import { ModeControl } from './components/ModeControl';
import { AngleControl } from './components/AngleControl';
import { TorqueMonitor } from './components/TorqueMonitor';
import { Console } from './components/Console';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import {useWebSocketStore} from "./stores/useWebSocketStore.ts";

function App() {
    const { lastMessage, connect, currentMode } = useWebSocketStore();
    const lastMessageRef = useRef(null);

    useEffect(() => {
        connect('ws://localhost:8080');
    }, [connect]);

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
                {/* YENİ YAPI: En üstte bağlantı durumu ve ortalanmış mod kontrolü */}
                <Group justify="space-between">
                    <div style={{ flex: 1 }}></div> {/* Sol boşluk */}
                    <ModeControl />
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}> {/* Sağdaki durum için */}
                        <ConnectionStatus />
                    </div>
                </Group>

                <Tabs defaultValue="control_panel" mt="md">
                    <Tabs.List>
                        <Tabs.Tab value="control_panel" leftSection={<IconGauge size={16} />}>
                            Kontrol Paneli
                        </Tabs.Tab>
                        <Tabs.Tab value="torque_monitor" leftSection={<IconBolt size={16} />}>
                            Tork Monitörü
                        </Tabs.Tab>
                        <Tabs.Tab value="console" leftSection={<IconTerminal2 size={16} />}>
                            Konsol
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="control_panel" pt="xl">
                        {/* YENİ: Seçilen moda göre farklı layout'lar gösteren dinamik alan */}
                        {currentMode === 's1' ? (
                            // "Continuous Mode" seçiliyken gösterilecek layout
                            <Center>
                                <SpeedControl />
                            </Center>
                        ) : (
                            // "Oscillation Mode" seçiliyken gösterilecek layout
                            <SimpleGrid cols={3} spacing="xl">
                                <SpeedControl />
                                <Paper withBorder p="md" radius="md" style={{ minHeight: 300 }}>
                                    <Center h="100%">
                                        <Text c="dimmed">Placeholder</Text>
                                    </Center>
                                </Paper>
                                <AngleControl />
                            </SimpleGrid>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="torque_monitor" pt="md">
                        <TorqueMonitor/>
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