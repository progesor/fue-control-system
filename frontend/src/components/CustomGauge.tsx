import { Box, Center, Text, rem } from '@mantine/core';

interface CustomGaugeProps {
    value: number;
    displayValue: number;
    min?: number;
    max?: number;
    label: string;
    unit: string;
}

export function CustomGauge({ value, displayValue, min = 0, max = 100, label, unit }: CustomGaugeProps) {
    const ratio = Math.max(0, Math.min((value - min) / (max - min), 1));

    const totalAngle = 245;
    const startAngle = -140;

    const rotation = startAngle + (ratio * totalAngle);

    const threshold = 50;
    const earlyMask = 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)';
    const lateMask = 'polygon(0% 0%, 100% 0%, 100% 50%, 50% 50%, 50% 100%, 0% 100%)';
    const activeMask = value < threshold ? earlyMask : lateMask;

    return (
        <Box pos="relative" w={rem(250)} h={rem(250)}>
            {/* 1. Katman: Arka plan */}
            <Box
                component="img"
                src="/gauge-background.svg"
                pos="absolute"
                w="100%"
                h="100%"
            />

            {/* Kırpma maskesinin uygulandığı sarmalayıcı */}
            <Box
                pos="absolute"
                w="100%"
                h="100%"
                style={{
                    clipPath: activeMask,
                    transition: 'clip-path 0.5s ease'
                }}
            >
                {/* 2. Katman: Dönen Gösterge */}
                <Box
                    pos="absolute"
                    w="100%"
                    h="100%"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 0.5s ease',
                    }}
                >
                    <Box
                        component="img"
                        src="/gauge-arc.svg"
                        w="100%"
                        h="100%"
                    />
                </Box>
            </Box>

            {/* 3. Katman: Ortadaki metinler */}
            <Center pos="absolute" w="100%" h="100%">
                <Box ta="center">
                    <Text size={rem(50)} fw={700} c="white" lh={1}>
                        {Math.round(displayValue)}
                        <span style={{ fontSize: rem(25), marginLeft: rem(4) }}>{unit}</span>
                    </Text>
                    <Text size="lg" c="dimmed" mt={-5}>{label}</Text>
                </Box>
            </Center>
        </Box>
    );
}