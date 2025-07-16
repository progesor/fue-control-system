import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Badge, Button, Group } from '@mantine/core';

export function ConnectionStatus() {
    const { isConnected, connect, disconnect } = useWebSocketStore();

    const handleConnect = () => {
        connect('ws://localhost:8080');
    };

    return (
        <Group>
            {isConnected ? (
                <Badge color="green" size="lg">BAĞLI</Badge>
            ) : (
                <Badge color="red" size="lg">BAĞLI DEĞİL</Badge>
            )}
            <Button onClick={handleConnect} disabled={isConnected} size="xs">
                Bağlan
            </Button>
            <Button onClick={disconnect} disabled={!isConnected} variant="outline" size="xs">
                Bağlantıyı Kes
            </Button>
        </Group>
    );
}