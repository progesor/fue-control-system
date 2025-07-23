// fue-control-system-main/frontend/src/components/CustomGauge.tsx
import { Box, Center, Text, rem } from '@mantine/core';

// Bileşenin alacağı prop'ların tiplerini tanımlıyoruz
interface CustomGaugeProps {
    value: number; // Mevcut değer (örneğin 0-100 arası yüzde)
    min?: number;  // Minimum değer
    max?: number;  // Maksimum değer
    label: string; // Değerin altındaki etiket (örn: "RPM")
    unit: string;  // Değerin birimi (örn: "")
}

export function CustomGauge({ value, min = 0, max = 100, label, unit }: CustomGaugeProps) {
    // Gelen değeri 0-1 aralığında bir orana çeviriyoruz
    const ratio = (value - min) / (max - min);

    // Kadranımız yaklaşık 270 derecelik bir yayı kapsıyor.
    // Başlangıç noktası solda (-135 derece), bitiş noktası sağda (+135 derece).
    const totalAngle = 270;
    const startAngle = -135;

    // Mevcut değere göre maskenin ne kadar döneceğini hesaplıyoruz
    const angle = startAngle + (ratio * totalAngle);

    return (
        <Box pos="relative" w={rem(250)} h={rem(250)}>
            {/* 1. Katman: Arka plan (Çerçeve ve çentikler) */}
            <Box
                component="img"
                src="/gauge-background.svg"
                pos="absolute"
                top={0}
                left={0}
                w="100%"
                h="100%"
            />

            {/* 2. Katman: Mavi "kuyruk" (Değer yayı) */}
            <Box
                pos="absolute"
                top={0}
                left={0}
                w="100%"
                h="100%"
                style={{
                    // Maskeleme burada gerçekleşiyor
                    maskImage: `conic-gradient(black var(--angle), transparent var(--angle))`,
                    WebkitMaskImage: `conic-gradient(black var(--angle), transparent var(--angle))`,
                    // Hesaplanan açıyı CSS değişkeni olarak iletiyoruz
                    '--angle': `${angle}deg`,
                }}
            >
                <Box
                    component="img"
                    src="/gauge-arc.svg"
                    w="100%"
                    h="100%"
                />
            </Box>

            {/* 3. Katman: Ortadaki metinler */}
            <Center pos="absolute" w="100%" h="100%">
                <Box ta="center">
                    <Text size={rem(60)} fw={700} c="white" lh={1}>
                        {Math.round(value)}
                        <span style={{ fontSize: rem(30), marginLeft: rem(4) }}>{unit}</span>
                    </Text>
                    <Text size="lg" c="dimmed" mt={-5}>{label}</Text>
                </Box>
            </Center>
        </Box>
    );
}