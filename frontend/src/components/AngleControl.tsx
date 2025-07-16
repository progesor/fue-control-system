import { useState, useEffect } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Slider, NumberInput, Group } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';

export function AngleControl() {
    const sendMessage = useWebSocketStore((state) => state.sendMessage);
    const [value, setValue] = useState(0);
    const [debouncedValue] = useDebouncedValue(value, 500);

    useEffect(() => {
        // Sadece başlangıçta (0 iken) komut göndermemek için kontrol
        if (debouncedValue !== 0) {
            // Tek fark burada: 'h' yerine 'a' komutunu gönderiyoruz.
            sendMessage({ type: 'COMMAND', payload: `a${debouncedValue}` });
        }
    }, [debouncedValue, sendMessage]);

    return (
        <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700}>Açı (°)</Text>
            <Text size="sm" c="dimmed" mb="xl">Motorun hareket edeceği açıyı ayarlayın.</Text>

            <Group>
                <Slider
                    value={value}
                    onChange={setValue}
                    min={0}
                    max={360} // Açı için mantıklı bir maksimum değer
                    step={5}   // Açı için mantıklı bir artış adımı
                    style={{ flexGrow: 1 }}
                    size="xl"
                    thumbSize={26}
                />
                <NumberInput
                    value={value}
                    onChange={(val) => setValue(Number(val))}
                    min={0}
                    max={360}
                    step={5}
                    w={120}
                    size="lg"
                    rightSection={<Text size="sm" c="dimmed">°</Text>} // Birim sembolü ekledik
                />
            </Group>
        </Paper>
    );
}