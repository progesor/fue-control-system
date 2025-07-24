import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Group, ActionIcon, Center, rem } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import { CustomGauge } from './CustomGauge';
import { OSCILLATION_BASE_ANGLES } from '../oscillationConfig';

export function AngleControl() {
    const { oscillationAngleIndex, setOscillationAngleIndex } = useWebSocketStore();

    const handleStepChange = (increment: number) => {
        // DÜZELTME: Fonksiyon göndermek yerine, mevcut değeri alıp yeni değeri hesaplıyoruz
        // ve set fonksiyonuna doğrudan yeni sayıyı gönderiyoruz.
        const newIndex = oscillationAngleIndex + increment;
        const boundedIndex = Math.max(0, Math.min(newIndex, OSCILLATION_BASE_ANGLES.length - 1));
        setOscillationAngleIndex(boundedIndex);
    };

    const currentBaseAngle = OSCILLATION_BASE_ANGLES[oscillationAngleIndex];
    const currentPercentage = (oscillationAngleIndex / (OSCILLATION_BASE_ANGLES.length - 1)) * 100;

    return (
        <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700} mb="lg">Açı Kontrolü</Text>

            <Center style={{ flexDirection: 'column' }}>
                <CustomGauge
                    value={currentPercentage}
                    displayValue={currentBaseAngle}
                    max={100}
                    label="Derece"
                    unit="°"
                />

                <Group justify="center" mt="md" w="100%">
                    <ActionIcon
                        size={rem(64)}
                        variant="default"
                        radius="xl"
                        onClick={() => handleStepChange(-1)}
                        disabled={oscillationAngleIndex === 0}
                    >
                        <IconMinus size={40} />
                    </ActionIcon>

                    <Text w={rem(120)} ta="center" size={rem(40)} fw={700} c="teal.4">
                        {`${currentBaseAngle}°`}
                    </Text>

                    <ActionIcon
                        size={rem(64)}
                        variant="default"
                        radius="xl"
                        onClick={() => handleStepChange(1)}
                        disabled={oscillationAngleIndex === OSCILLATION_BASE_ANGLES.length - 1}
                    >
                        <IconPlus size={40} />
                    </ActionIcon>
                </Group>
            </Center>
        </Paper>
    );
}