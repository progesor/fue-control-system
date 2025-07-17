// backend/src/services/HardwareCommunicationService.ts

import { ICommunicationService } from './ICommunicationService';
import { EventEmitter } from 'events';
import { Pca9685Driver } from 'pca9685';
import i2c from 'i2c-bus';

// Constants for motor control pins
const MOTOR_A_PINS = { IN1: 0, IN2: 1, PWM: 2 };
// A short braking period (in ms) to allow the motor to stop before reversing
const BRAKE_DURATION_MS = 20;

export class HardwareCommunicationService extends EventEmitter implements ICommunicationService {
    private pwm?: Pca9685Driver;
    private isRunning = false;
    private isInitialized = false;
    private isSequenceRunning = false;
    private sequenceTimer: NodeJS.Timeout | null = null;

    constructor() {
        super();
        try {
            const i2cBus = i2c.openSync(1);
            this.pwm = new Pca9685Driver({ i2c: i2cBus, address: 0x40, frequency: 1600 }, (err) => {
                if (err) {
                    console.error("PCA9685 başlatılırken hata oluştu.", err);
                    this.isInitialized = false;
                } else {
                    console.log("PCA9685 başarıyla başlatıldı.");
                    this.isInitialized = true;
                    this.setMotorDirection('stop');
                }
            });
        } catch (error) {
            console.error("I2C bus açılamadı!", error);
            this.isInitialized = false;
        }
    }

    public async start(): Promise<void> { this.isRunning = true; }
    public async stop(): Promise<void> { this.stopSequence(); this.isRunning = false; }
    public sendCommand(command: string): void { /* This can remain as is */ }

    public async executeSequence(sequence: any[]): Promise<void> {
        if (this.isSequenceRunning) return;
        this.isSequenceRunning = true;
        console.log("Komut dizisi yürütülmeye başlandı.");

        for (const command of sequence) {
            if (!this.isSequenceRunning) break;
            console.log(`Yürütülüyor: ${command.type} | Süre: ${command.duration}ms`);
            try {
                switch (command.type) {
                    case 'FORWARD':
                        await this.runForward(command.power, command.duration);
                        break;
                    case 'OSCILLATE':
                        // A slower period for distinct back-and-forth movement
                        await this.runPeriodicMovement(command.power, command.duration, 75);
                        break;
                    case 'VIBRATE':
                        // A very fast period for vibration
                        await this.runPeriodicMovement(command.power, command.duration, 25);
                        break;
                    case 'PAUSE':
                        await this.runPause(command.duration);
                        break;
                }
            } catch (error) {
                if (error instanceof Error && error.message === "Sequence stopped") {
                    console.log("Dizi durduruldu.");
                    break;
                }
            }
        }

        console.log("Komut dizisi tamamlandı.");
        this.setMotorDirection('stop');
        this.isSequenceRunning = false;
    }

    public stopSequence(): void {
        this.isSequenceRunning = false;
        if (this.sequenceTimer) {
            clearTimeout(this.sequenceTimer);
            this.sequenceTimer = null;
        }
    }

    private utilDelay = (ms: number): Promise<void> => {
        return new Promise(resolve => {
            if (!this.isSequenceRunning) return resolve();
            this.sequenceTimer = setTimeout(resolve, ms);
        });
    };

    private runForward(power: number, duration: number): Promise<void> {
        return new Promise(async (resolve) => {
            if (!this.isSequenceRunning) return resolve();
            this.setMotorDirection('forward');
            this.setMotorSpeedPWM(power / 100);
            await this.utilDelay(duration);
            this.setMotorDirection('stop');
            resolve();
        });
    }

    private runPause(duration: number): Promise<void> {
        return new Promise(async (resolve) => {
            this.setMotorDirection('stop');
            await this.utilDelay(duration);
            resolve();
        });
    }

    // --- The Corrected Oscillation/Vibration Logic ---
    private runPeriodicMovement(power: number, duration: number, periodMs: number): Promise<void> {
        return new Promise(async (resolve) => {
            const endTime = Date.now() + duration;
            this.setMotorSpeedPWM(power / 100);

            while (this.isSequenceRunning && Date.now() < endTime) {
                // Move Forward
                this.setMotorDirection('forward');
                await this.utilDelay(periodMs);
                if (!this.isSequenceRunning) break;

                // Brake before reversing
                this.setMotorDirection('brake');
                await this.utilDelay(BRAKE_DURATION_MS);
                if (!this.isSequenceRunning) break;

                // Move Reverse
                this.setMotorDirection('reverse');
                await this.utilDelay(periodMs);
                if (!this.isSequenceRunning) break;

                // Brake before going forward again
                this.setMotorDirection('brake');
                await this.utilDelay(BRAKE_DURATION_MS);
            }

            this.setMotorDirection('stop');
            resolve();
        });
    }

    // --- Low-Level Motor Control Functions ---
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