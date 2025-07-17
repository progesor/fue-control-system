// backend/src/services/HardwareCommunicationService.ts

import { ICommunicationService } from './ICommunicationService';
import { EventEmitter } from 'events';
import { Pca9685Driver } from 'pca9685';
import i2c from 'i2c-bus';

// Motor sürücü HAT üzerindeki PCA9685'in TB6612FNG motor çipine
// hangi kanallardan bağlandığını tanımlıyoruz.
const MOTOR_A_PINS = {
    IN1: 0,  // Yön Pini 1 (Direction)
    IN2: 1,  // Yön Pini 2 (Direction)
    PWM: 2,  // Hız Pini (Speed)
};

export class HardwareCommunicationService extends EventEmitter implements ICommunicationService {
    private pwm?: Pca9685Driver;
    private isRunning = false;
    private isInitialized = false;
    private isSequenceRunning = false;

    constructor() {
        super();
        try {
            const i2cBus = i2c.openSync(1); // I2C-1 bus'ını aç
            const options = {
                i2c: i2cBus,
                address: 0x40, // HAT'in varsayılan I2C adresi
                frequency: 1600, // Motor kontrolü için PWM frekansı
                debug: false,
            };

            // Kütüphanenin doğru başlatma yöntemi: Constructor'a callback fonksiyonu vermek
            this.pwm = new Pca9685Driver(options, (err) => {
                if (err) {
                    console.error("PCA9685 başlatılırken hata oluştu.", err);
                    console.error("Çözüm önerisi: `sudo raspi-config` ile I2C arayüzünün aktif olduğundan ve HAT'in doğru takıldığından emin olun.");
                    this.isInitialized = false;
                } else {
                    console.log("PCA9685 başarıyla başlatıldı.");
                    this.isInitialized = true;
                    this.setMotorDirection('stop'); // Başlangıçta motorun durduğundan emin ol
                    this.setMotorSpeedPWM(0);
                }
            });

        } catch (error) {
            console.error("I2C bus açılamadı!", error);
            this.isInitialized = false;
        }
    }

    // Bu public metotlar artık bir interface'den geliyor.
    public async start(): Promise<void> {
        console.log("Hardware Communication Service başlatılıyor...");
        this.isRunning = true;
    }

    public async stop(): Promise<void> {
        console.log("Hardware Communication Service durduruluyor.");
        this.setMotorSpeedPWM(0);
        this.isRunning = false;
    }

    public sendCommand(command: string): void {
        if (!this.isRunning || !this.isInitialized) {
            console.error("Servis çalışmıyor veya başlatılamadı. Komut işlenemiyor:", command);
            this.emit('data', 'e');
            return;
        }

        console.log(`DONANIMA GÖNDERİLEN KOMUT: ${command}`);
        const commandType = command.charAt(0);
        const value = parseInt(command.substring(1), 10);

        try {
            switch (commandType) {
                case 'h': // Hız Kontrolü
                    const pwmValue = Math.round((value / 5000) * 4095);
                    this.setMotorSpeedPWM(pwmValue);
                    break;
                case 's': // Mod Kontrolü (Yön)
                    this.setMotorDirection(command === 's1' ? 'forward' : 'reverse');
                    break;
                // Diğer komutlar (a, t vb.) buraya eklenebilir.
                default:
                    console.warn(`Bilinmeyen komut tipi: ${commandType}`);
                    this.emit('data', 'e');
                    return;
            }
            this.emit('data', 'o'); // Komut başarılı
        } catch (error) {
            console.error("Komut işlenirken hata:", error);
            this.emit('data', 'e');
        }
    }

    // YENİ: Dışarıdan komut dizisini alacak ana fonksiyon
    public async executeSequence(sequence: any[]): Promise<void> {
        if (this.isSequenceRunning) {
            console.log("Mevcut bir dizi zaten çalışıyor.");
            return;
        }

        console.log("Komut dizisi yürütülmeye başlandı:", sequence);
        this.isSequenceRunning = true;

        for (const command of sequence) {
            // Eğer sequence çalışırken durdurma komutu gelirse döngüden çık
            if (!this.isSequenceRunning) {
                console.log("Komut dizisi dışarıdan durduruldu.");
                break;
            }

            console.log(`Yürütülüyor: ${command.type}`);
            switch (command.type) {
                case 'FORWARD':
                    await this.runForward(command.power, command.duration);
                    break;
                case 'OSCILLATE':
                    await this.runOscillate(command.angle, command.power, command.duration);
                    break;
                case 'PAUSE':
                    await this.runPause(command.duration);
                    break;
                // Gelecekteki 'VIBRATE' gibi komutlar buraya eklenecek
            }
        }

        console.log("Komut dizisi tamamlandı.");
        this.isSequenceRunning = false;
        this.setMotorSpeedPWM(0); // Her şey bittiğinde motoru durdur.
    }

    public stopSequence(): void {
        this.isSequenceRunning = false;
    }

    // --- YENİ Yardımcı Fonksiyonlar ---

    private runForward(power: number, duration: number): Promise<void> {
        return new Promise(resolve => {
            const pwmValue = Math.round((power / 100) * 4095);
            this.setMotorDirection('forward');
            this.setMotorSpeedPWM(pwmValue);

            setTimeout(() => {
                this.setMotorSpeedPWM(0); // Adım bitince motoru durdur
                resolve(); // Süre dolunca Promise'i çöz ve sıradaki adıma geç
            }, duration);
        });
    }

    private runPause(duration: number): Promise<void> {
        return new Promise(resolve => {
            this.setMotorSpeedPWM(0); // Emin olmak için motoru durdur
            setTimeout(resolve, duration);
        });
    }

    private runOscillate(angle: number, power: number, duration: number): Promise<void> {
        return new Promise(async resolve => {
            const endTime = Date.now() + duration;
            const pwmValue = Math.round((power / 100) * 4095);

            // Osilasyon hızını güce göre kabaca hesaplayalım (daha sonra ayarlanabilir)
            // Saniyedeki tam tur sayısı (RPS) = RPM / 60. RPM'i de güçten tahmin edelim.
            const rpm = (power / 100) * 5000; // max 5000 RPM varsayımı
            const rps = rpm / 60;
            const degreesPerSecond = rps * 360;
            const timeForAngle = (angle / degreesPerSecond) * 1000; // ms

            this.setMotorSpeedPWM(pwmValue);

            while (Date.now() < endTime && this.isSequenceRunning) {
                this.setMotorDirection('forward');
                await this.runPause(timeForAngle);

                // Zaman dolduysa veya durdurulduysa hemen çık
                if (Date.now() >= endTime || !this.isSequenceRunning) break;

                this.setMotorDirection('reverse');
                await this.runPause(timeForAngle);
            }

            this.setMotorSpeedPWM(0);
            resolve();
        });
    }

    // --- Özel (Private) Yardımcı Fonksiyonlar ---

    private setMotorSpeedPWM(pwmValue: number): void {
        if (!this.pwm) return;
        const clampedValue = Math.max(0, Math.min(4095, pwmValue));
        // setDutyCycle metodu kütüphanede mevcut ve doğru kullanım bu şekildedir
        this.pwm.setDutyCycle(MOTOR_A_PINS.PWM, clampedValue / 4095);
    }

    private setMotorDirection(direction: 'forward' | 'reverse' | 'stop'): void {
        if (!this.pwm) return;

        // `setPin` yerine `channelOn` ve `channelOff` metodları kullanılıyor
        // Bunlar bir kanalı tamamen (%100) açar veya kapatır.
        if (direction === 'forward') {
            this.pwm.channelOn(MOTOR_A_PINS.IN1);
            this.pwm.channelOff(MOTOR_A_PINS.IN2);
        } else if (direction === 'reverse') {
            this.pwm.channelOff(MOTOR_A_PINS.IN1);
            this.pwm.channelOn(MOTOR_A_PINS.IN2);
        } else { // stop
            this.pwm.channelOff(MOTOR_A_PINS.IN1);
            this.pwm.channelOff(MOTOR_A_PINS.IN2);
        }
    }
}