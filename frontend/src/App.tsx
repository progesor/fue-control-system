import { useEffect, useRef } from 'react';
import { Container, Title, Stack, SimpleGrid, Tabs, Group } from '@mantine/core';
import { IconGauge, IconTerminal2, IconBolt } from '@tabler/icons-react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { SpeedControl } from './components/SpeedControl';
import { ModeControl } from './components/ModeControl';
import { AngleControl } from './components/AngleControl';
import { TorqueMonitor } from './components/TorqueMonitor';
import { Console } from './components/Console';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import { useWebSocketStore } from './stores/useWebSocketStore';

function App() {
    // Gerekli state ve fonksiyonları store'dan alıyoruz
    const { lastMessage, connect, currentMode } = useWebSocketStore();
    const lastMessageRef = useRef(null);

    // YENİ: Uygulama ilk açıldığında otomatik olarak bağlanmayı dene
    useEffect(() => {
        connect('ws://192.168.2.183:8080');
    }, [connect]);

    // Hata mesajlarını dinleyen useEffect (aynı kaldı)
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
                <Group justify="space-between">
                    <Title order={1}>FUE Motor Kontrol Arayüzü</Title>
                    <ConnectionStatus />
                </Group>

                <Tabs defaultValue="control_panel">
                    <Tabs.List>
                        <Tabs.Tab value="control_panel" leftSection={<IconGauge size={16} />}>
                            Kontrol Paneli
                        </Tabs.Tab>
                        {/* YENİ: Tork Monitörü için yeni sekme */}
                        <Tabs.Tab value="torque_monitor" leftSection={<IconBolt size={16} />}>
                            Tork Monitörü
                        </Tabs.Tab>
                        <Tabs.Tab value="console" leftSection={<IconTerminal2 size={16} />}>
                            Konsol
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="control_panel" pt="md">
                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                            {/* SOL SÜTUN */}
                            <Stack>
                                {/* YENİ: ModeControl artık solda */}
                                <ModeControl />
                            </Stack>

                            {/* SAĞ SÜTUN */}
                            <Stack style={{ gridColumn: 'span 2' }}>
                                <SpeedControl />
                                {/* YENİ: Sadece 's2' (Oscillation) modunda Açı Kontrolünü göster */}
                                {currentMode === 's2' && <AngleControl />}
                            </Stack>
                        </SimpleGrid>
                    </Tabs.Panel>

                    {/* YENİ: Tork Monitörü için yeni panel */}
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