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
import {useWebSocketStore} from "./stores/useWebSocketStore";
import { OSCILLATION_SPEEDS, OSCILLATION_ANGLES_TABLE } from './oscillationConfig';

function App() {
    const {
        lastMessage,
        connect,
        currentMode,
        sendMessage,
        oscillationSpeedIndex,
        oscillationAngleIndex,
        oscillationInitStep
    } = useWebSocketStore();
    const lastMessageRef = useRef(null);
    // const isInitialMount = useRef(true);
    const prevSpeedIndex = useRef(oscillationSpeedIndex);
    const prevAngleIndex = useRef(oscillationAngleIndex);

    useEffect(() => {
        connect('ws://192.168.2.183:8080');
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

    useEffect(() => {
        // Sadece oscillation modundaysak ve kurulum tamamlandıysa bu mantığı çalıştır
        if (currentMode === 's2' && oscillationInitStep === 'complete') {
            const speedChanged = prevSpeedIndex.current !== oscillationSpeedIndex;
            const angleChanged = prevAngleIndex.current !== oscillationAngleIndex;

            // Eğer hiçbir şey değişmediyse bir şey yapma
            if (!speedChanged && !angleChanged) return;

            const speedToSend = OSCILLATION_SPEEDS[oscillationSpeedIndex];
            // Yeni açı her zaman mevcut hız ve açı indeksine göre hesaplanır
            const angleToSend = OSCILLATION_ANGLES_TABLE[oscillationSpeedIndex][oscillationAngleIndex];

            if (speedChanged) {
                // Hız değiştiyse, hem yeni hızı hem de bu hıza karşılık gelen yeni açıyı gönder
                console.log(`OSC_OP: Speed changed. Sending H:${speedToSend}, A:${angleToSend}`);
                sendMessage({ type: 'COMMAND', payload: `h${speedToSend}` });
                sendMessage({ type: 'COMMAND', payload: `a${angleToSend}` });
            } else if (angleChanged) {
                // Sadece açı değiştiyse, sadece yeni açıyı gönder
                console.log(`OSC_OP: Angle changed. Sending A:${angleToSend}`);
                sendMessage({ type: 'COMMAND', payload: `a${angleToSend}` });
            }

            // Son gönderilen indeksleri referans olarak kaydet
            prevSpeedIndex.current = oscillationSpeedIndex;
            prevAngleIndex.current = oscillationAngleIndex;
        }
    }, [currentMode, oscillationSpeedIndex, oscillationAngleIndex, sendMessage, oscillationInitStep]);

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