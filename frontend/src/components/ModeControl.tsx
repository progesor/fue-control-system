import { useWebSocketStore } from '../stores/useWebSocketStore';
import { SegmentedControl } from '@mantine/core';
import config from '../../../backend/config.json';

export function ModeControl() {
    const { sendMessage, setCurrentMode, currentMode } = useWebSocketStore();

    const handleModeChange = (value: string) => {
        setCurrentMode(value);
        sendMessage({ type: 'COMMAND', payload: value });
    };

    const modeData = config.modes.map(mode => ({
        label: mode.name,
        value: mode.id
    }));

    // Artık Paper veya Text olmadan, sadece SegmentedControl'ü döndürüyoruz.
    return (
        <SegmentedControl
            data={modeData}
            value={currentMode}
            onChange={handleModeChange}
            size="lg"
            radius="md"
            transitionDuration={500}
            transitionTimingFunction="linear"
        />
    );
}