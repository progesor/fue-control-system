import { useEffect, useRef } from 'react';
import {Container, Title, Stack, Tabs} from '@mantine/core';
import { ConnectionStatus } from './components/ConnectionStatus';
import { SpeedControl } from './components/SpeedControl';
import { ModeControl } from './components/ModeControl';
import { AngleControl } from './components/AngleControl';
import { TorqueMonitor } from './components/TorqueMonitor';
import { TimerControl } from './components/TimerControl';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import { useWebSocketStore } from './stores/useWebSocketStore';
import { IconTools, IconReportAnalytics } from '@tabler/icons-react';
import {SequenceBuilder} from "./components/SequenceBuilder.tsx";
import {OscillationTester} from "./components/OscillationTester.tsx";

function App() {
    const lastMessage = useWebSocketStore((state) => state.lastMessage);
    const lastMessageRef = useRef(null); // Tekrarlanan bildirimleri engellemek için

    // lastMessage her değiştiğinde bu blok çalışacak
    useEffect(() => {
        // Eğer yeni bir mesaj varsa ve bu daha önce işlenmediyse...
        if (lastMessage && lastMessage !== lastMessageRef.current) {
            // Mesajın referansını güncelleyerek tekrar işlenmesini engelle
            lastMessageRef.current = lastMessage;

            // Eğer mesaj bir cihaz cevabı ve içeriği 'e' (error) ise...
            if (lastMessage.type === 'DEVICE_RESPONSE' && lastMessage.payload === 'e') {
                // Hata bildirimi göster!
                notifications.show({
                    title: 'Cihaz Hatası',
                    message: 'Gönderilen komut anlaşılamadı veya bir hata oluştu.',
                    color: 'red',
                    icon: <IconX />,
                    autoClose: 5000, // 5 saniye sonra otomatik kapan
                });
            }
        }
    }, [lastMessage]); // Bu useEffect'in 'lastMessage' değiştiğinde çalışmasını sağla

    return (
        <Container size="xl" my="xl">
            <Stack>
                <Title order={1}>FUE Motor Kontrol Arayüzü</Title>
                <ConnectionStatus />

                <Tabs defaultValue="recipe">
                    <Tabs.List>
                        <Tabs.Tab value="recipe" leftSection={<IconReportAnalytics size={16} />}>
                            Reçete Kontrolü
                        </Tabs.Tab>
                        <Tabs.Tab value="tester" leftSection={<IconTools size={16} />}>
                            Gelişmiş Osilasyon Testi
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="recipe" pt="md">
                        {/* Burası eski ana sayfa içeriğiniz olacak */}
                        <SpeedControl/>
                        <ModeControl/>
                        <AngleControl/>
                        <TorqueMonitor/>
                        <TimerControl/>
                        <SequenceBuilder />
                    </Tabs.Panel>

                    <Tabs.Panel value="tester" pt="md">
                        <OscillationTester />
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}

export default App