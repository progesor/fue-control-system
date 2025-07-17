// backend/src/services/HardwareCommunicationService.ts

import { ICommunicationService } from './ICommunicationService';
import { EventEmitter } from 'events';
import { Pca9685Driver } from 'pca9685';
import i2c from 'i2c-bus';

// --- KALİBRASYON ve AYARLAR ---
const MAX_RPM_AT_FULL_POWER = 10000;
const BRAKE_DURATION_MS = 20;

const MOTOR_A_PINS = { IN1: 0, IN2: 1, PWM: 2 };

export class HardwareCommunicationService extends EventEmitter implements ICommunicationService {
    private pwm?: Pca9685Driver;
    private isRunning = false;
    private isInitialized = false;
    private isSequenceRunning = false;

    constructor() {
        super();
        try {
            const i2cBus = i2c.openSync(1);
            this.pwm = new Pca9685Driver({ i2c: i2cBus, address: 0x40, frequency: 1600 }, (err) => {
                this.isInitialized = !err;
                if (err) {
                    console.error("PCA9685 başlatılırken hata oluştu.", err);
                } else {
                    console.log("PCA9685 başarıyla başlatıldı.");
                    this.setMotorDirection('stop');
                }
            });
        } catch (error) {
            console.error("I2C bus açılamadı!", error);
        }
    }

    public async start(): Promise<void> { this.isRunning = true; }
    public async stop(): Promise<void> { this.stopSequence(); this.isRunning = false; }
    public sendCommand(command: string): void { /* eski haliyle kalabilir */ }

    // --- YENİ ve DAHA SAĞLAM REÇETE MOTORU ---
    public async executeSequence(sequence: any[]): Promise<void> {
        if (this.isSequenceRunning) {
            console.warn("Mevcut bir dizi zaten çalışıyor, yeni istek reddedildi.");
            return;
        }
        this.isSequenceRunning = true;
        console.log("Komut dizisi yürütülmeye başlandı.");

        try {
            for (const command of sequence) {
                // Her döngünün başında durdurma komutu gelip gelmediğini kontrol et
                if (!this.isSequenceRunning) {
                    throw new Error("Sequence stopped by user");
                }

                console.log(`Yürütülüyor: ${command.type}`);

                switch (command.type) {
                    case 'FORWARD':
                        await this.runForward(command.power, command.duration);
                        break;
                    case 'OSCILLATE':
                        await this.runAngleOscillation(command.power, command.angle, command.duration);
                        break;
                    case 'VIBRATE':
                        await this.runVibration(command.power, command.duration);
                        break;
                    case 'PAUSE':
                        await this.runPause(command.duration);
                        break;
                    default:
                        console.warn(`Bilinmeyen komut tipi: ${command.type}`);
                        break;
                }
            }
            console.log("Komut dizisi başarıyla tamamlandı.");
        } catch (error) {
            if (error instanceof Error && error.message === 'Sequence stopped by user') {
                console.log("Komut dizisi kullanıcı tarafından durduruldu.");
            } else {
                console.error("Dizi yürütülürken bir hata oluştu:", error);
            }
        } finally {
            // Ne olursa olsun, dizi bittiğinde motoru durdur ve flag'i sıfırla.
            this.setMotorDirection('stop');
            this.isSequenceRunning = false;
        }
    }

    public stopSequence(): void {
        console.log("Durdurma komutu alındı.");
        this.isSequenceRunning = false;
    }

    // --- Hareket Stratejileri ---

    private utilDelay(ms: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => resolve(), ms);
            // Durdurma komutu geldiğinde beklemenin anında iptal edilmesi için
            // bir kontrol mekanizması.
            const checkStop = setInterval(() => {
                if (!this.isSequenceRunning) {
                    clearTimeout(timer);
                    clearInterval(checkStop);
                    reject(new Error("Sequence stopped by user"));
                }
            }, 10); // 10ms'de bir kontrol et
        });
    }

    private async runForward(power: number, duration: number): Promise<void> {
        this.setMotorDirection('forward');
        this.setMotorSpeedPWM(power / 100);
        await this.utilDelay(duration);
    }

    private async runPause(duration: number): Promise<void> {
        this.setMotorDirection('stop');
        await this.utilDelay(duration);
    }

    private runVibration(power: number, duration: number): Promise<void> {
        return this.runPeriodicMovement(power, duration, 25);
    }

    private async runAngleOscillation(power: number, angle: number, duration: number): Promise<void> {
        if (angle <= 0) return;
        const rpm = (power / 100) * MAX_RPM_AT_FULL_POWER;
        const degreesPerSecond = (rpm / 60) * 360;
        const timeToTravelAngleMs = degreesPerSecond > 0 ? (angle / degreesPerSecond) * 1000 : Infinity;
        await this.runPeriodicMovement(power, duration, timeToTravelAngleMs);
    }

    private async runPeriodicMovement(power: number, duration: number, periodMs: number): Promise<void> {
        const endTime = Date.now() + duration;
        this.setMotorSpeedPWM(power / 100);

        while (Date.now() < endTime) {
            // Döngünün bu noktasında tekrar kontrol et, çünkü utilDelay hata fırlatmış olabilir
            if (!this.isSequenceRunning) break;

            this.setMotorDirection('forward');
            await this.utilDelay(periodMs);

            this.setMotorDirection('brake');
            await this.utilDelay(BRAKE_DURATION_MS);

            this.setMotorDirection('reverse');
            await this.utilDelay(periodMs);

            this.setMotorDirection('brake');
            await this.utilDelay(BRAKE_DURATION_MS);
        }
    }

    // --- Düşük Seviye Kontrol Fonksiyonları (DEĞİŞİKLİK YOK) ---
    private setMotorSpeedPWM(pwmValue: number): void {
        if (!this.isInitialized) return;
        this.pwm?.setDutyCycle(MOTOR_A_PINS.PWM, Math.max(0, Math.min(1, pwmValue)));
    }
    private setMotorDirection(direction: 'forward' | 'reverse' | 'brake' | 'stop'): void {
        if (!this.isInitialized) return;
        switch (direction) {
            case 'forward':
                this.pwm?.channelOn(MOTOR_A_PINS.IN1);
                this.pwm?.channelOff(MOTOR_A_PINS.IN2);
                break;
            case 'reverse':
                this.pwm?.channelOff(MOTOR_A_PINS.IN1);
                this.pwm?.channelOn(MOTOR_A_PINS.IN2);
                break;
            case 'brake':
                this.pwm?.channelOn(MOTOR_A_PINS.IN1);
                this.pwm?.channelOn(MOTOR_A_PINS.IN2);
                break;
            case 'stop':
                this.pwm?.channelOff(MOTOR_A_PINS.IN1);
                this.pwm?.channelOff(MOTOR_A_PINS.IN2);
                break;
        }
    }
}