import { useState, useEffect, useRef } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Group, ActionIcon, Popover, Center, rem } from '@mantine/core';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import Slider from 'rc-slider';

// DÜZELTME: 0 RPM değeri en başa eklendi. Artık 11 kademe var.
const RPM_STEPS = [0, 1500, 2000, 3500, 4500, 6000, 7000, 8000, 9000, 15000, 18000];

// DÜZELTME: %0 değeri eklendi.
const PERCENTAGE_MAP = RPM_STEPS.map((_, index) => index * 10);

// DÜZELTME: Yeni kademelere uygun marklar ve daha büyük yazı tipi.
const marks = {
    0: { style: { fontSize: rem(18), fontWeight: 700, color: '#adb5bd' }, label: '0%' },
    5: { style: { fontSize: rem(18), fontWeight: 700, color: '#adb5bd' }, label: '50%' },
    10: { style: { fontSize: rem(18), fontWeight: 700, color: '#adb5bd' }, label: '100%' }
};

export function SpeedControl() {
    const sendMessage = useWebSocketStore((state) => state.sendMessage);
    // Artık 0-10 arasında bir indeks tutuyoruz. Başlangıç değeri 0 (%0).
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

    const handleSliderChange = (value: number | number[]) => {
        if (typeof value === 'number') {
            setSpeedIndex(value);
        }
    }

    const currentPercentage = PERCENTAGE_MAP[speedIndex];
    const currentRpm = RPM_STEPS[speedIndex];

    return (
        <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700}>Hız Kontrolü</Text>

            <Group justify="space-around" my="lg" align="center">
                <ActionIcon
                    size={rem(64)}
                    variant="default"
                    radius="xl"
                    onClick={() => handleStepChange(-1)}
                    disabled={speedIndex === 0}
                >
                    <IconMinus size={rem(40)} />
                </ActionIcon>

                <Popover width={rem(150)} position="bottom" withArrow shadow="md">
                    <Popover.Target>
                        <Center style={{ flexDirection: 'column', cursor: 'pointer' }}>
                            <Text size={rem(56)} fw={700} c={currentPercentage === 0 ? 'dimmed' : 'blue.4'}>
                                {`${currentPercentage}%`}
                            </Text>
                            <Text size="sm" c="dimmed">{`${currentRpm} RPM`}</Text>
                        </Center>
                    </Popover.Target>
                    <Popover.Dropdown style={{ padding: `${rem(30)} ${rem(50)}` }}>
                        <div style={{ height: rem(220) }}>
                            <Slider
                                vertical
                                min={0}
                                max={RPM_STEPS.length - 1} // Max değer artık 10
                                step={1}
                                marks={marks}
                                value={speedIndex}
                                onChange={handleSliderChange}
                                // DÜZELTME: Handle'ı ortalamak ve çubuğu büyütmek için son ayarlar
                                railStyle={{ backgroundColor: '#555', width: rem(16) }}
                                trackStyle={{ backgroundColor: '#228be6', width: rem(16) }}
                                handleStyle={{
                                    borderColor: '#228be6',
                                    backgroundColor: '#fff',
                                    width: rem(40),
                                    height: rem(40),
                                    // Handle'ı (genişlik/2 - çubukGenişlik/2) kadar sola kaydırarak ortalıyoruz
                                    marginLeft: rem(-12),
                                    marginTop: rem(-16)
                                }}
                                dotStyle={{ display: 'none' }} // Ara noktaları gizleyerek daha temiz bir görünüm
                            />
                        </div>
                    </Popover.Dropdown>
                </Popover>

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
        </Paper>
    );
}