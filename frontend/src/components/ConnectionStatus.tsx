import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Badge, Group, Loader, Text } from '@mantine/core';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';

export function ConnectionStatus() {
    const isConnected = useWebSocketStore((state) => state.isConnected);

    return (
        <Group gap="xs">
            {isConnected ? (
                <Badge color="green" size="lg" variant="filled" leftSection={<IconWifi size={14} />}>
                    HAZIR
                </Badge>
            ) : (
                <Badge color="red" size="lg" variant="light" leftSection={<Loader size={14} color="red" />}>
                    LÜTFEN BEKLEYİN...
                </Badge>
            )}
        </Group>
    );
}