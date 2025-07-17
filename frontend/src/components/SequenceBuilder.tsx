// frontend/src/components/SequenceBuilder.tsx
import { useState } from 'react';
import { Paper, Title, Stack, Group, Select, Slider, Button, NumberInput, Code, Text } from '@mantine/core';
import { useWebSocketStore } from '../stores/useWebSocketStore';

export function SequenceBuilder() {
    const sendMessage = useWebSocketStore((state) => state.sendMessage);
    const [sequence, setSequence] = useState<any[]>([]);

    // Form state'leri
    const [type, setType] = useState('FORWARD');
    const [power, setPower] = useState(80);
    const [duration, setDuration] = useState(1000);
    const [angle, setAngle] = useState(60);

    const handleAddStep = () => {
        let newStep: any = { type, duration };
        if (type === 'FORWARD' || type === 'OSCILLATE') {
            newStep.power = power;
        }
        if (type === 'OSCILLATE') {
            newStep.angle = angle;
        }
        setSequence([...sequence, newStep]);
    };

    const handleRunSequence = () => {
        // Backend'e tüm reçeteyi tek bir mesajla gönderiyoruz.
        // Bu mesajın tipini WebSocketServer'da yakalayıp executeSequence'e yönlendireceğiz.
        sendMessage({ type: 'EXECUTE_SEQUENCE', payload: sequence });
    };

    return (
        <Paper withBorder p="md" radius="md">
            <Title order={3}>Programlanabilir Reçete</Title>

            {/* Form Alanı */}
            <Stack mt="md">
                <Select
                    label="Komut Tipi"
                    value={type}
                    onChange={(val) => setType(val || 'FORWARD')}
                    data={['FORWARD', 'OSCILLATE', 'PAUSE', 'VIBRATE']}
                />
                { (type === 'FORWARD' || type === 'OSCILLATE') && <Slider label="Güç (%)" value={power} onChange={setPower} min={0} max={100} /> }
                { type === 'OSCILLATE' && <NumberInput label="Açı (°)" value={angle} onChange={(val) => setAngle(Number(val))} /> }
                <NumberInput label="Süre (ms)" value={duration} onChange={(val) => setDuration(Number(val))} step={100} min={0} />
                <Button onClick={handleAddStep}>Adım Ekle</Button>
            </Stack>

            {/* Mevcut Reçete Gösterimi */}
            <Stack mt="xl">
                <Text fw={500}>Mevcut Adımlar:</Text>
                {sequence.length === 0 ? (
                    <Text c="dimmed" fs="italic">Henüz adım eklenmedi.</Text>
                ) : (
                    <Paper bg="dark.8" p="sm" radius="sm">
                        <Code block>{JSON.stringify(sequence, null, 2)}</Code>
                    </Paper>
                )}
                <Button
                    onClick={handleRunSequence}
                    color="teal"
                    disabled={sequence.length === 0}
                    fullWidth
                    size="lg"
                >
                    REÇETEYİ ÇALIŞTIR
                </Button>
                <Button
                    onClick={() => setSequence([])}
                    color="red"
                    variant="outline"
                    disabled={sequence.length === 0}
                >
                    Temizle
                </Button>
            </Stack>
        </Paper>
    );
}