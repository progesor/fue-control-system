import { useState } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, SegmentedControl } from '@mantine/core';
import config from '../../../backend/config.json'; // Backend'in config dosyasını import ediyoruz

export function ModeControl() {
    const sendMessage = useWebSocketStore((state) => state.sendMessage);

    // config.json'daki ilk modu varsayılan olarak ayarlıyoruz
    const [currentMode, setCurrentMode] = useState(config.modes[0].id);

    const handleModeChange = (value: string) => {
        setCurrentMode(value); // Arayüzü anında güncelle
        sendMessage({ type: 'COMMAND', payload: value }); // Cihaza komutu gönder
    };

    // config.json'daki modları Mantine'ın istediği formata çeviriyoruz
    const modeData = config.modes.map(mode => ({
        label: mode.name,
        value: mode.id
    }));

    return (
        <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700}>Çalışma Modu</Text>
            <Text size="sm" c="dimmed" mb="xl">Cihazın çalışma yöntemini seçin.</Text>
            <SegmentedControl
                data={modeData}
                value={currentMode}
                onChange={handleModeChange}
                size="lg" // Dokunmatik kullanım için büyük
                fullWidth // Konteyneri tamamen doldurur
                transitionDuration={500}
                transitionTimingFunction="linear"
            />
        </Paper>
    );
}