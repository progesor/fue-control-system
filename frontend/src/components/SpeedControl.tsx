import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Group, ActionIcon, Center, rem } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import { CustomGauge } from './CustomGauge';
import { OSCILLATION_SPEEDS } from '../oscillationConfig';
import {useEffect, useState} from "react";

// Continuous mod için hız kademeleri
const CONTINUOUS_RPM_STEPS = [0, 1500, 2000, 3500, 4500, 6000, 7000, 8000, 9000, 15000, 18000];

export function SpeedControl() {
    const {
        sendMessage,
        currentMode,
        oscillationSpeedIndex,
        setOscillationSpeedIndex
    } = useWebSocketStore();

    // Continuous mod için lokal bir state tutmaya devam ediyoruz
    const [continuousSpeedIndex, setContinuousSpeedIndex] = useState(1);

    const isOscillationMode = currentMode === 's2';

    // Aktif moda göre doğru verileri ve state'leri seçiyoruz
    const activeIndex = isOscillationMode ? oscillationSpeedIndex : continuousSpeedIndex;
    const setActiveIndex = isOscillationMode ? setOscillationSpeedIndex : setContinuousSpeedIndex;
    const speedSteps = isOscillationMode ? OSCILLATION_SPEEDS : CONTINUOUS_RPM_STEPS;

    // Sadece Continuous modda komut gönderimini yönetiyoruz.
    // Oscillation modunun komutları App.tsx'den yönetiliyor.
    useEffect(() => {
        if (!isOscillationMode) {
            const rpmToSend = speedSteps[activeIndex];
            sendMessage({ type: 'COMMAND', payload: `h${rpmToSend}` });
        }
    }, [continuousSpeedIndex]);

    const handleStepChange = (increment: number) => {
        const newIndex = activeIndex + increment;
        const boundedIndex = Math.max(0, Math.min(newIndex, speedSteps.length - 1));

        // set state'i bir fonksiyon olarak çağırarak önceki state'e güvenli erişim
        if (typeof setActiveIndex === 'function') {
            setActiveIndex(boundedIndex);
        }
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