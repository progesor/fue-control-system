import { useWebSocketStore } from '../stores/useWebSocketStore';
import { SegmentedControl } from '@mantine/core';
import config from '../../../backend/config.json';

export function ModeControl() {
    // DÜZELTME: Gerekli tüm fonksiyonları store'dan alıyoruz
    const { setCurrentMode, currentMode, startOscillationInit, sendMessage } = useWebSocketStore();

    const handleModeChange = (value: string) => {
        // Arayüzdeki modu anında güncelliyoruz
        setCurrentMode(value);

        // Seçilen moda göre farklı eylemler gerçekleştiriyoruz
        if (value === 's2') {
            // "Oscillation Mode" seçildiyse, sıralı komut sekansını başlat
            startOscillationInit();
        } else {
            // "Continuous Mode" veya diğer modlar seçildiyse, sadece o modun komutunu gönder
            // ve otomatik başlatma sekansını tetikle (isteklerinizde olduğu gibi)
            sendMessage({ type: 'COMMAND', payload: 's1' });
            sendMessage({ type: 'COMMAND', payload: 'h1500' });
        }
    };

    const modeData = config.modes.map(mode => ({
        label: mode.name,
        value: mode.id
    }));

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