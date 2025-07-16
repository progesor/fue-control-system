import { useState, useEffect, useRef } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, Button, Group } from '@mantine/core';

// Saniyeyi MM:SS formatına çeviren yardımcı fonksiyon
function formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

export function TimerControl() {
    const sendMessage = useWebSocketStore((state) => state.sendMessage);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<number | null>(null);

    // Zamanlayıcı aktif olduğunda saniyeyi artıran ana mantık
    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setSeconds((prevSeconds) => prevSeconds + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive]);

    // Her 10 saniyede bir cihaza zaman bilgisini gönderen mantık
    useEffect(() => {
        if (isActive && seconds > 0 && seconds % 10 === 0) {
            sendMessage({ type: 'COMMAND', payload: `t${seconds}` });
        }
    }, [seconds, isActive, sendMessage]);

    const handleStartStop = () => {
        setIsActive(!isActive);
    };

    const handleReset = () => {
        setIsActive(false);
        setSeconds(0);
    };

    return (
        <Paper withBorder p="md" radius="md">
            <Text size="lg" fw={500}>Süre Ölçer</Text>
            <Text size="3rem" fw={700} ta="center" my="sm">
                {formatTime(seconds)}
            </Text>
            <Group justify="center">
                <Button onClick={handleStartStop} color={isActive ? 'red' : 'green'} w={100}>
                    {isActive ? 'Durdur' : 'Başlat'}
                </Button>
                <Button onClick={handleReset} variant="outline" disabled={isActive}>
                    Sıfırla
                </Button>
            </Group>
        </Paper>
    );
}