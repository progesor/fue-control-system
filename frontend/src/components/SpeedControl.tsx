import { useState, useEffect, useRef } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Group, ActionIcon, Center, rem } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import { CustomGauge } from './CustomGauge';
// YENİ: Oscillation config'i import ediyoruz
import { OSCILLATION_SPEEDS } from '../oscillationConfig';

// Continuous mod için hız kademeleri (artık kendi adıyla daha belirgin)
const CONTINUOUS_RPM_STEPS = [0, 1500, 2000, 3500, 4500, 6000, 7000, 8000, 9000, 15000, 18000];

export function SpeedControl() {
    // YENİ: Gerekli tüm state ve fonksiyonları store'dan alıyoruz
    const {
        sendMessage,
        currentMode,
        oscillationSpeedIndex,
        setOscillationSpeedIndex
    } = useWebSocketStore();

    // Continuous mod için lokal bir state tutmaya devam ediyoruz
    const [continuousSpeedIndex, setContinuousSpeedIndex] = useState(1);
    const isInitialMount = useRef(true);

    // YENİ: Hangi modun aktif olduğuna göre doğru verileri ve fonksiyonları seçiyoruz
    const isOscillationMode = currentMode === 's2';
    const activeIndex = isOscillationMode ? oscillationSpeedIndex : continuousSpeedIndex;
    const setActiveIndex = isOscillationMode ? setOscillationSpeedIndex : setContinuousSpeedIndex;
    const speedSteps = isOscillationMode ? OSCILLATION_SPEEDS : CONTINUOUS_RPM_STEPS;

    // Komut gönderme mantığı Continuous mod için burada kalıyor.
    // Oscillation modunun komutları App.tsx'den yönetiliyor.
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (!isOscillationMode) {
            const rpmToSend = speedSteps[activeIndex];
            sendMessage({ type: 'COMMAND', payload: `h${rpmToSend}` });
        }
    }, [continuousSpeedIndex]); // Sadece continuous index'i değiştiğinde tetiklenir

    const handleStepChange = (increment: number) => {
        const newIndex = activeIndex + increment;
        setActiveIndex(Math.max(0, Math.min(newIndex, speedSteps.length - 1)));
    };

    const currentRpm = speedSteps[activeIndex];
    const currentPercentage = (activeIndex / (speedSteps.length - 1)) * 100;

    return (
        <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700} mb="lg">Hız Kontrolü</Text>
            <Center style={{ flexDirection: 'column' }}>
                <CustomGauge
                    value={currentPercentage}
                    displayValue={currentRpm}
                    max={100}
                    label="RPM"
                    unit=""
                />
                <Group justify="center" mt="md" w="100%">
                    <ActionIcon
                        size={rem(64)}
                        variant="default"
                        radius="xl"
                        onClick={() => handleStepChange(-1)}
                        disabled={activeIndex === 0}
                    >
                        <IconMinus size={40} />
                    </ActionIcon>
                    <Text w={rem(120)} ta="center" size={rem(56)} fw={700} c={currentRpm === 0 ? 'dimmed' : 'blue.4'}>
                        {`${Math.round(currentPercentage)}%`}
                    </Text>
                    <ActionIcon
                        size={rem(64)}
                        variant="default"
                        radius="xl"
                        onClick={() => handleStepChange(1)}
                        disabled={activeIndex === speedSteps.length - 1}
                    >
                        <IconPlus size={40} />
                    </ActionIcon>
                </Group>
            </Center>
        </Paper>
    );
}