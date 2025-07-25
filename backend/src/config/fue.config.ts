// backend/src/config/fue.config.ts
// Bu dosya, FUE projesine özel tüm donanım pinlerini ve sabitleri içerir.

export const fueConfig = {
    // Arduino'ya bağlı pinlerin numaraları
    pins: {
        motor: {
            pwm: 6,   // En1 - Motor Hız Kontrolü
            dir1: 7,  // M11 - Yön 1
            dir2: 8,  // M12 - Yön 2
        },
        buzzer: 2,
        inputs: {
            pedal1: 9,
            pedal2: 13,
            footHandSwitch: 12,
        },
        // Gelecekteki sensörler için analog pinler
        analog: {
            potentiometer: 0, // A0
            encoder: 1,       // A1 (Örnek)
        }
    },

    // Motor kontrol parametreleri
    motorParams: {
        maxPwm: 255,
        minPwm: 50, // Motorun dönmeye başladığı minimum PWM değeri
        rampingFactor: 0.1, // Hızlanma/yavaşlama yumuşaklığı (0.01 - 1.0)
    },

    // Sistem parametreleri
    system: {
        // Backend'in Arduino'dan ne sıklıkla veri okuyacağı (ms)
        inputPollingInterval: 50,
        // Backend'in anlık durumu ne sıklıkla frontend'e göndereceği (ms)
        stateUpdateInterval: 100,
    }
};
