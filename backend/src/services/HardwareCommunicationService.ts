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