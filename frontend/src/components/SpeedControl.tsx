import { useState, useEffect, useRef } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Group, ActionIcon, Center, rem } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import { CustomGauge } from './CustomGauge';

const RPM_STEPS = [0, 1500, 2000, 3500, 4500, 6000, 7000, 8000, 9000, 15000, 18000];
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
                {/* YENİ AYAR: Kadran yüzdeye göre hareket ederken, ortasında RPM gösteriyor */}
                <CustomGauge
                    value={currentPercentage} // Kadranın dönüşü yüzdeye bağlandı
                    displayValue={currentRpm} // Ortadaki yazı RPM'i gösteriyor
                    max={100} // Kadranın maksimum değeri 100
                    label="RPM"
                    unit=""
                />

                <Group justify="center" mt="md" w="100%">
                    <ActionIcon
                        size={rem(64)}
                        variant="default"
                        radius="xl"
                        onClick={() => handleStepChange(-1)}
                        disabled={speedIndex === 0}
                    >
                        <IconMinus size={40} />
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
                        <IconPlus size={40} />
                    </ActionIcon>
                </Group>
            </Center>
        </Paper>
    );
}