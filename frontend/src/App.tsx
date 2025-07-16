import { useEffect, useRef } from 'react';
import { Container, Title, Stack, SimpleGrid } from '@mantine/core';
import { ConnectionStatus } from './components/ConnectionStatus';
import { SpeedControl } from './components/SpeedControl';
import { ModeControl } from './components/ModeControl';
import { AngleControl } from './components/AngleControl';
import { TorqueMonitor } from './components/TorqueMonitor';
import { TimerControl } from './components/TimerControl';
import { notifications } from '@mantine/notifications';
import { IconX } from '@tabler/icons-react';
import { useWebSocketStore } from './stores/useWebSocketStore';

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

                {/* Ana yerleşim için Grid sistemi */}
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    {/* SOL SÜTUN (Ayarlar ve Durum) */}
                    <Stack>
                        <ConnectionStatus />
                        <TimerControl/>
                        {/* Diğer ayar kartları buraya gelebilir */}
                    </Stack>

                    {/* SAĞ SÜTUN (Ana Kontroller - 2 birimlik yer kaplar) */}
                    <Stack style={{ gridColumn: 'span 2' }}>
                        <SpeedControl />
                        <ModeControl />
                        <AngleControl/>
                        <TorqueMonitor/>
                        {/* Diğer ana kontrol kartları (Açı, Mod vb.) buraya gelecek */}
                    </Stack>
                </SimpleGrid>
            </Stack>
        </Container>
    );
}

export default App