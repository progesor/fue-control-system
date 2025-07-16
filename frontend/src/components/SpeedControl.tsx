import { useState } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Slider, NumberInput, Group } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect } from 'react';

export function SpeedControl() {
    const sendMessage = useWebSocketStore((state) => state.sendMessage);
    // Slider'ın ve NumberInput'un anlık değerini tutmak için local state
    const [value, setValue] = useState(0);

    // Değerin kullanıcı tarafından değiştirilmesi durduktan 500ms sonra güncellenecek olan debounced değer
    const [debouncedValue] = useDebouncedValue(value, 500);

    // debouncedValue her değiştiğinde (yani kullanıcı slider'ı bırakıp 500ms beklediğinde)
    // cihaza komutu gönder.
    useEffect(() => {
        // Sadece başlangıçta (0 iken) komut göndermemek için kontrol
        if (debouncedValue !== 0) {
            sendMessage({ type: 'COMMAND', payload: `h${debouncedValue}` });
        }
    }, [debouncedValue, sendMessage]);


    return (
        <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700}>Hız (RPM)</Text>
            <Text size="sm" c="dimmed" mb="xl">Motorun dönüş hızını ayarlayın.</Text>

            {/* Slider ve Sayısal Girişi bir arada tutan grup */}
            <Group >
                <Slider
                    value={value}
                    onChange={setValue}
                    min={0}
                    max={5000}
                    step={50}
                    style={{ flexGrow: 1 }} // Grubun içinde esneyerek boşluğu doldurur
                    size="xl" // Dokunmatik için büyük slider
                    thumbSize={26} // Slider topuzunu daha da büyük yapar
                />
                <NumberInput
                    value={value}
                    onChange={(val) => setValue(Number(val))}
                    min={0}
                    max={5000}
                    step={50}
                    w={120} // Genişlik
                    size="lg" // Büyük font ve input
                />
            </Group>
        </Paper>
    );
}