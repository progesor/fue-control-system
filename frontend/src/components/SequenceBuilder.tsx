// frontend/src/components/SequenceBuilder.tsx
import { useState } from 'react';
import { Paper, Title, Stack, Group, Select, Slider, Button, NumberInput, Code, Text } from '@mantine/core';
import { useWebSocketStore } from '../stores/useWebSocketStore';

export function SequenceBuilder() {
    // sendMessage'i store'dan alıyoruz
    const sendMessage = useWebSocketStore((state) => state.sendMessage);
    const [sequence, setSequence] = useState<any[]>([]);

    // Form state'leri
    const [type, setType] = useState('FORWARD');
    const [power, setPower] = useState(80);
    const [duration, setDuration] = useState(1000);
    // Açı artık doğrudan kullanılmıyor, bu state kaldırılabilir veya gelecekteki bir özellik için tutulabilir.
    // const [angle, setAngle] = useState(60);

    const handleAddStep = () => {
        let newStep: any = { type, duration };
        // Sadece güç gerektiren komut tipleri için güç ekle
        if (type === 'FORWARD' || type === 'OSCILLATE' || type === 'VIBRATE') {
            newStep.power = power;
        }
        setSequence([...sequence, newStep]);
    };

    const handleRunSequence = () => {
        sendMessage({ type: 'EXECUTE_SEQUENCE', payload: sequence });
    };

    // YENİ: Diziyi durdurma komutu gönderen fonksiyon
    const handleStopSequence = () => {
        sendMessage({ type: 'STOP_SEQUENCE' });
    };

    return (
        <Paper withBorder p="md" radius="md">
            <Title order={3}>Programlanabilir Reçete</Title>

            <Stack mt="md">
                <Select
                    label="Komut Tipi"
                    value={type}
                    onChange={(val) => setType(val || 'FORWARD')}
                    // YENİ: VIBRATE seçeneği eklendi
                    data={['FORWARD', 'OSCILLATE', 'VIBRATE', 'PAUSE']}
                />
                { (type !== 'PAUSE') && <Slider label="Güç (%)" value={power} onChange={setPower} min={0} max={100} /> }
                <NumberInput label="Süre (ms)" value={duration} onChange={(val) => setDuration(Number(val))} step={100} min={0} />
                <Button onClick={handleAddStep}>Adım Ekle</Button>
            </Stack>

            <Stack mt="xl">
                <Text fw={500}>Mevcut Adımlar:</Text>
                {sequence.length > 0 && (
                    <Paper bg="dark.8" p="sm" radius="sm">
                        <Code block>{JSON.stringify(sequence, null, 2)}</Code>
                    </Paper>
                )}
                <Group grow>
                    <Button onClick={handleRunSequence} color="teal" disabled={sequence.length === 0} size="lg">
                        ÇALIŞTIR
                    </Button>
                    {/* YENİ: Acil Durdurma Butonu */}
                    <Button onClick={handleStopSequence} color="orange" variant="filled" size="lg">
                        DURDUR
                    </Button>
                </Group>
                <Button onClick={() => setSequence([])} color="red" variant="outline" disabled={sequence.length === 0}>
                    Listeyi Temizle
                </Button>
            </Stack>
        </Paper>
    );
}