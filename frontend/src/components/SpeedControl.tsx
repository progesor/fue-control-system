import { useState, useEffect, useRef } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Group, ActionIcon, Center, rem } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import ReactSpeedometer from 'react-d3-speedometer';

// 0 RPM değeri dahil 11 kademe
const RPM_STEPS = [0, 1500, 2000, 3500, 4500, 6000, 7000, 8000, 9000, 15000, 18000];
// Yüzde değerleri artık 0'dan 100'e kadar. Kadran bunu kullanacak.
const PERCENTAGE_MAP = RPM_STEPS.map((_, index) => index * 10);

export function SpeedControl() {
    const sendMessage = useWebSocketStore((state) => state.sendMessage);
    const [speedIndex, setSpeedIndex] = useState(0);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            const rpmToSend = RPM_STEPS[speedIndex];
            sendMessage({ type: 'COMMAND', payload: `h${rpmToSend}` });
        }
    }, [speedIndex, sendMessage]);

    const handleStepChange = (increment: number) => {
        setSpeedIndex((currentIndex) => {
            const newIndex = currentIndex + increment;
            return Math.max(0, Math.min(newIndex, RPM_STEPS.length - 1));
        });
    };

    const currentPercentage = PERCENTAGE_MAP[speedIndex];
    const currentRpm = RPM_STEPS[speedIndex];

    return (
        <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700} mb="lg">Hız Kontrolü</Text>

            <Center style={{ flexDirection: 'column' }}>
                {/* YENİ KADRAN BİLEŞENİ */}
                <ReactSpeedometer
                    width={300}
                    height={180}
                    minValue={0}
                    maxValue={100}
                    value={currentPercentage}
                    segments={10} // 10'ar artan 10 segment
                    needleHeightRatio={0.7}
                    needleColor="#495057" // Gri iğne
                    startColor="#1971c2" // Başlangıç rengi (Mavi)
                    endColor="#4c6ef5"   // Bitiş rengi (Daha açık mavi)
                    segmentColors={['#1971c2', '#1c7ed6', '#228be6', '#339af0', '#4dabf7', '#74c0fc', '#a5d8ff']}
                    ringWidth={30}
                    // Metin ve etiket stilleri
                    valueTextFontSize={rem(24)}
                    valueTextFontWeight="700"
                    textColor="#dee2e6" // Metin rengi
                    // Değeri RPM olarak göster
                    currentValueText={`${currentRpm} RPM`}
                />

                <Group justify="center" mt="md" w="100%">
                    <ActionIcon
                        size={rem(64)}
                        variant="default"
                        radius="xl"
                        onClick={() => handleStepChange(-1)}
                        disabled={speedIndex === 0}
                    >
                        <IconMinus size={rem(40)} />
                    </ActionIcon>

                    <Text w={rem(120)} ta="center" size={rem(56)} fw={700} c={currentPercentage === 0 ? 'dimmed' : 'blue.4'}>
                        {`${currentPercentage}%`}
                    </Text>

                    <ActionIcon
                        size={rem(64)}
                        variant="default"
                        radius="xl"
                        onClick={() => handleStepChange(1)}
                        disabled={speedIndex === RPM_STEPS.length - 1}
                    >
                        <IconPlus size={rem(40)} />
                    </ActionIcon>
                </Group>
            </Center>
        </Paper>
    );
}