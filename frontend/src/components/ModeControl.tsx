import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, SegmentedControl } from '@mantine/core';
import config from '../../../backend/config.json';

export function ModeControl() {
    // Hem mesaj gönderme hem de state güncelleme fonksiyonlarını alıyoruz
    const { sendMessage, setCurrentMode, currentMode } = useWebSocketStore();

    const handleModeChange = (value: string) => {
        setCurrentMode(value); // Merkezi state'i anında güncelle
        sendMessage({ type: 'COMMAND', payload: value }); // Cihaza komutu gönder
    };

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
                value={currentMode} // Değeri merkezi state'den al
                onChange={handleModeChange}
                size="lg"
                fullWidth
                transitionDuration={500}
                transitionTimingFunction="linear"
            />
        </Paper>
    );
}