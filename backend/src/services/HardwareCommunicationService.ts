// backend/src/services/HardwareCommunicationService.ts

import { ICommunicationService } from './ICommunicationService';
import { EventEmitter } from 'events';
import { Pca9685Driver } from 'pca9685';
import i2c from 'i2c-bus';

// --- KALİBRASYON ve AYARLAR ---
const MAX_RPM_AT_FULL_POWER = 10000;
// DÜZELTME: Motorun tepki vermesi için minimum süre ve fren süresini daha makul değerlere ayarlıyoruz.
const MINIMUM_PULSE_MS = 20;
const BRAKE_DURATION_MS = 30;

const MOTOR_A_PINS = { IN1: 0, IN2: 1, PWM: 2 };

export class HardwareCommunicationService extends EventEmitter implements ICommunicationService {
    private pwm?: Pca9685Driver;
    private isInitialized = false;
    private isSequenceRunning = false;

    constructor() {
        super();
        try {
            const i2cBus = i2c.openSync(1);
            this.pwm = new Pca9685Driver({ i2c: i2cBus, address: 0x40, frequency: 1600 }, (err) => {
                this.isInitialized = !err;
                if (err) console.error("PCA9685 başlatılamadı.", err);
                else {
                    console.log("PCA9685 başarıyla başlatıldı.");
                    this.setMotorDirection('stop');
                }
            });
        } catch (error) {
            console.error("I2C bus açılamadı!", error);
        }
    }

    public async start(): Promise<void> {}
    public async stop(): Promise<void> { this.stopSequence(); }

    public async executeSequence(sequence: any[]): Promise<void> {
        if (this.isSequenceRunning) {
            console.warn("Mevcut dizi çalışırken yeni istek reddedildi.");
            return;
        }
        this.isSequenceRunning = true;
        console.log("Komut dizisi yürütülmeye başlandı.");
        try {
            for (const command of sequence) {
                if (!this.isSequenceRunning) throw new Error("Sequence stopped");
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
                }
            }
        } catch (e) {
            console.log("Dizi durduruldu veya bir hatayla karşılaştı.");
        } finally {
            console.log("Dizi sonlandı.");
            this.setMotorDirection('stop');
            this.isSequenceRunning = false;
        }
    }

    public stopSequence(): void {
        console.log("Durdurma komutu alindi.");
        this.isSequenceRunning = false;
    }

    // Test panelinden gelen doğrudan osilasyon komutunu işleyen public fonksiyon.
    public async runDirectOscillationTest(power: number, duration: number, periodMs: number, brakeMs: number): Promise<void> {
        if (this.isSequenceRunning) {
            console.warn("UYARI: Başka bir işlem çalışırken test başlatılamaz.");
            return;
        }
        this.isSequenceRunning = true;
        console.log(`TEST BAŞLATILDI: Güç=${power}, Süre=${duration}, Periyot=${periodMs}, Fren=${brakeMs}`);
        try {
            await this.runPeriodicMovement(power, duration, periodMs, brakeMs);
        } catch (e) {
            console.log("Test durduruldu.");
        } finally {
            console.log("Test sonlandı.");
            this.setMotorDirection('stop');
            this.isSequenceRunning = false;
        }
    }

    public sendCommand(command: string): void {
        console.warn(`sendCommand ('${command}') kullanımdan kaldırıldı.`);
    }

    private utilDelay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async runForward(power: number, duration: number): Promise<void> {
        if (!this.isSequenceRunning) return;
        this.setMotorDirection('forward');
        this.setMotorSpeedPWM(power / 100);
        await this.utilDelay(duration);
        this.setMotorDirection('stop');
    }

    private async runPause(duration: number): Promise<void> {
        if (!this.isSequenceRunning) return;
        this.setMotorDirection('stop');
        await this.utilDelay(duration);
    }

    private runVibration(power: number, duration: number): Promise<void> {
        return this.runPeriodicMovement(power, duration, MINIMUM_PULSE_MS, 15);
    }

    private async runAngleOscillation(power: number, angle: number | undefined, duration: number): Promise<void> {
        const safeAngle = (typeof angle === 'number' && angle > 0) ? angle : 90;
        if (typeof angle === 'undefined') {
            console.warn(`Açı değeri gelmedi. Varsayılan olarak ${safeAngle}° kullanılıyor.`);
        }
        const rpm = (power / 100) * MAX_RPM_AT_FULL_POWER;
        const degreesPerSecond = (rpm / 60) * 360;
        let timeToTravelAngleMs = degreesPerSecond > 0 ? (safeAngle / degreesPerSecond) * 1000 : Infinity;
        if (timeToTravelAngleMs < MINIMUM_PULSE_MS) {
            console.warn(`Hesaplanan süre (${timeToTravelAngleMs.toFixed(2)}ms) çok kısa. Minimuma (${MINIMUM_PULSE_MS}ms) çekildi.`);
            timeToTravelAngleMs = MINIMUM_PULSE_MS;
        }
        console.log(`Hesaplanan: Güç=${power}%, RPM=${rpm.toFixed(0)}, Tek Yön Süresi=${timeToTravelAngleMs.toFixed(2)}ms`);
        await this.runPeriodicMovement(power, duration, timeToTravelAngleMs, BRAKE_DURATION_MS);
    }

    // Bu fonksiyon artık hem reçete hem de test paneli tarafından kullanılan ana motor
    private async runPeriodicMovement(power: number, duration: number, periodMs: number, brakeMs: number): Promise<void> {
        const endTime = Date.now() + duration;
        this.setMotorSpeedPWM(power / 100);
        while (Date.now() < endTime && this.isSequenceRunning) {
            this.setMotorDirection('forward');
            await this.utilDelay(periodMs);
            if (!this.isSequenceRunning) break;
            this.setMotorDirection('brake');
            await this.utilDelay(brakeMs);
            if (!this.isSequenceRunning) break;
            this.setMotorDirection('reverse');
            await this.utilDelay(periodMs);
            if (!this.isSequenceRunning) break;
            this.setMotorDirection('brake');
            await this.utilDelay(brakeMs);
        }
    }

    private setMotorSpeedPWM(pwmValue: number): void {
        if (!this.isInitialized) return;
        this.pwm?.setDutyCycle(MOTOR_A_PINS.PWM, Math.max(0, Math.min(1, pwmValue)));
    }

    private setMotorDirection(direction: 'forward' | 'reverse' | 'brake' | 'stop'): void {
        if (!this.isInitialized) return;
        switch (direction) {
            case 'forward':
                this.pwm?.channelOn(MOTOR_A_PINS.IN1); this.pwm?.channelOff(MOTOR_A_PINS.IN2); break;
            case 'reverse':
                this.pwm?.channelOff(MOTOR_A_PINS.IN1); this.pwm?.channelOn(MOTOR_A_PINS.IN2); break;
            case 'brake':
                this.pwm?.channelOn(MOTOR_A_PINS.IN1); this.pwm?.channelOn(MOTOR_A_PINS.IN2); break;
            case 'stop':
            default:
                this.pwm?.channelOff(MOTOR_A_PINS.IN1); this.pwm?.channelOff(MOTOR_A_PINS.IN2); break;
        }
    }
}