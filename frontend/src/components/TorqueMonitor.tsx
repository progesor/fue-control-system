import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Button, Group } from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TorqueMonitor() {
    const { isMeasuringTorque, torqueData, startTorqueMeasurement, stopTorqueMeasurement } = useWebSocketStore();

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
                <div>
                    <Text size="xl" fw={700}>Tork Monitörü</Text>
                    <Text size="sm" c="dimmed">Canlı tork verisini izleyin.</Text>
                </div>
                {!isMeasuringTorque ? (
                    <Button onClick={startTorqueMeasurement} color="teal">Ölçümü Başlat</Button>
                ) : (
                    <Button onClick={stopTorqueMeasurement} color="red">Durdur</Button>
                )}
            </Group>

            {/* Grafik için bir alan ayırıyoruz */}
            <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                    <LineChart data={torqueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        {/*<Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />*/}
                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Paper>
    );
}