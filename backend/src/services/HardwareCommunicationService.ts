// backend/src/services/HardwareCommunicationService.ts

import { ICommunicationService } from './ICommunicationService';
import { EventEmitter } from 'events';
import { Pca9685Driver } from 'pca9685';
import i2c from 'i2c-bus';

const MAX_RPM_AT_FULL_POWER = 10000;
const MINIMUM_PULSE_MS = 15;

const MOTOR_A_PINS = { IN1: 0, IN2: 1, PWM: 2 };

export class HardwareCommunicationService extends EventEmitter implements ICommunicationService {
    private pwm?: Pca9685Driver;
    private isInitialized = false;
    private isSequenceRunning = false;

    private log(message: string): void {
        console.log(message);
        this.emit('log', `[${new Date().toLocaleTimeString()}] ${message}`);
    }

    constructor() {
        super();
        try {
            const i2cBus = i2c.openSync(1);
            this.pwm = new Pca9685Driver({ i2c: i2cBus, address: 0x40, frequency: 1600 }, (err) => {
                this.isInitialized = !err;
                if (err) this.log(`HATA: PCA9685 başlatılamadı. ${err.message}`);
                else {
                    this.log("PCA9685 başarıyla başlatıldı.");
                    this.setMotorDirection('stop');
                }
            });
        } catch (error: any) {
            this.log(`HATA: I2C bus açılamadı! ${error.message}`);
        }
    }

    public async start(): Promise<void> {}
    public async stop(): Promise<void> { this.stopSequence(); }

    public async executeSequence(sequence: any[]): Promise<void> {
        if (this.isSequenceRunning) {
            this.log("UYARI: Mevcut dizi çalışırken yeni istek reddedildi.");
            return;
        }
        this.isSequenceRunning = true;
        this.log("Komut dizisi yürütülmeye başlandı.");
        try {
            for (const command of sequence) {
                if (!this.isSequenceRunning) throw new Error("Sequence stopped");
                this.log(`Yürütülüyor: ${command.type}`);
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
            this.log("Dizi durduruldu veya bir hatayla karşılaştı.");
        } finally {
            this.log("Dizi sonlandı.");
            this.setMotorDirection('stop');
            this.isSequenceRunning = false;
        }
    }

    public stopSequence(): void {
        this.log("Durdurma komutu alindi.");
        this.isSequenceRunning = false;
    }

    // YENİ: Sadece test paneli için özel, public bir fonksiyon
    public async runDirectOscillationTest(power: number, duration: number, periodMs: number, brakeMs: number): Promise<void> {
        if (this.isSequenceRunning) {
            this.log("UYARI: Başka bir işlem çalışırken test başlatılamaz.");
            return;
        }
        this.isSequenceRunning = true;
        this.log(`TEST BAŞLATILDI: Güç=${power}, Süre=${duration}, Periyot=${periodMs}, Fren=${brakeMs}`);
        try {
            await this.runPeriodicMovement(power, duration, periodMs, brakeMs);
        } catch (e) {
            this.log("Test durduruldu.");
        } finally {
            this.log("Test sonlandı.");
            this.setMotorDirection('stop');
            this.isSequenceRunning = false;
        }
    }

    public sendCommand(command: string): void { this.log(`UYARI: sendCommand ('${command}') kullanımdan kaldırıldı.`); }
    private utilDelay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
    private async runForward(power: number, duration: number): Promise<void> { /* ... Değişiklik yok ... */ }
    private async runPause(duration: number): Promise<void> { /* ... Değişiklik yok ... */ }
    private runVibration(power: number, duration: number): Promise<void> { return this.runPeriodicMovement(power, duration, MINIMUM_PULSE_MS, 10); }
    private async runAngleOscillation(power: number, angle: number | undefined, duration: number): Promise<void> { /* ... Değişiklik yok ... */ }

    // Bu fonksiyon artık private ve sadece içeriden çağrılıyor
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
    private setMotorSpeedPWM(pwmValue: number): void { /* ... Değişiklik yok ... */ }
    private setMotorDirection(direction: 'forward' | 'reverse' | 'brake' | 'stop'): void { /* ... Değişiklik yok ... */ }
}