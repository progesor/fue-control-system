// fue-control-system-main/frontend/src/components/Console.tsx
import { useState, useEffect, useRef } from 'react';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import { Paper, Text, TextInput, Button, Group, ScrollArea, Code } from '@mantine/core';
import { IconTerminal2 } from '@tabler/icons-react';

export function Console() {
    const { messageHistory, sendMessage } = useWebSocketStore();
    const [command, setCommand] = useState('');
    const viewport = useRef<HTMLDivElement>(null);

    // Yeni bir mesaj geldiğinde scroll'u en alta kaydır
    useEffect(() => {
        viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
    }, [messageHistory]);

    const handleSendCommand = () => {
        if (command.trim()) {
            // Protokole uygun olarak JSON formatında gönderiyoruz
            sendMessage({ type: 'COMMAND', payload: command.trim() });
            setCommand('');
        }
    };

    return (
        <Paper withBorder p="md" radius="md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Text size="xl" fw={700}>Haberleşme Konsolu</Text>
            <Text size="sm" c="dimmed" mb="md">Cihaz ile olan tüm anlık veri akışını izleyin ve manuel komut gönderin.</Text>

            <ScrollArea style={{ flex: 1, marginBottom: '1rem' }} viewportRef={viewport}>
                {messageHistory.map((msg, index) => (
                    <Code block key={index} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap' }}>
                        {msg}
                    </Code>
                ))}
            </ScrollArea>

            <Group>
                <TextInput
                    placeholder="Gönderilecek komut (örn: h1500)"
                    style={{ flex: 1 }}
                    value={command}
                    onChange={(event) => setCommand(event.currentTarget.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            handleSendCommand();
                        }
                    }}
                />
                <Button
                    onClick={handleSendCommand}
                    leftSection={<IconTerminal2 size={16} />}
                >
                    Gönder
                </Button>
            </Group>
        </Paper>
    );
}