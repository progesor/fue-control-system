// frontend/src/components/OscillationTester.tsx

import { useState } from 'react';
import { Paper, Title, Stack, Slider, Button, NumberInput, Grid, Code, ScrollArea, Text } from '@mantine/core';
import { useWebSocketStore } from '../stores/useWebSocketStore';

export function OscillationTester() {
    const { sendMessage, logMessages } = useWebSocketStore();

    const [power, setPower] = useState(50);
    const [duration, setDuration] = useState(3000);
    const [periodMs, setPeriodMs] = useState(50);
    const [brakeMs, setBrakeMs] = useState(30);

    const handleStartTest = () => {
        sendMessage({
            type: 'DIRECT_OSCILLATE_TEST',
            payload: { power, duration, periodMs, brakeMs }
        });
    };

    const handleStop = () => {
        sendMessage({ type: 'STOP_SEQUENCE' });
    };

    return (
        <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md">
                    <Title order={3}>Osilasyon Test Paneli</Title>
                    <Stack mt="md" gap="xl">
                        <div>
                            <Text>Güç (%): {power}</Text>
                            <Slider value={power} onChange={setPower} step={5} />
                        </div>
                        <NumberInput
                            label="Tek Yön Hareket Süresi (periodMs)"
                            description="Osilasyon hızını belirler. Düşük değer = hızlı osilasyon."
                            value={periodMs}
                            onChange={(val) => setPeriodMs(Number(val))}
                            step={5}
                            min={15}
                        />
                        <NumberInput
                            label="Frenleme Süresi (brakeMs)"
                            description="Yön değişimleri arasındaki duraklama."
                            value={brakeMs}
                            onChange={(val) => setBrakeMs(Number(val))}
                            step={5}
                            min={10}
                        />
                        <NumberInput
                            label="Toplam Test Süresi (ms)"
                            value={duration}
                            onChange={(val) => setDuration(Number(val))}
                            step={500}
                        />
                        <Button onClick={handleStartTest} size="lg" color="teal">TESTİ BAŞLAT</Button>
                        <Button onClick={handleStop} size="md" color="red" variant="outline">ACİL DURDUR</Button>
                    </Stack>
                </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <Paper withBorder p="md" radius="md" h="100%">
                    <Title order={3}>Canlı Sunucu Logları</Title>
                    <ScrollArea h={400} mt="md">
                        <Code block>
                            {(logMessages || []).join('\n')}
                        </Code>
                    </ScrollArea>
                </Paper>
            </Grid.Col>
        </Grid>
    );
}